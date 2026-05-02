import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable, NotFoundException } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { Album } from './entities/album.entity';
import { VideoFile } from './entities/video-file.entity';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { lookup } from 'mime-types';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;

@Injectable()
export class FilesService {
  private readonly s3Client = new S3Client({
    region: 'auto',
    endpoint: this.configService.getOrThrow('AWS_ENDPOINT'),
    credentials: {
      accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY'),
      secretAccessKey: this.configService.getOrThrow('AWS_SECRET_KEY'),
    },
    forcePathStyle: true,
  });

  private readonly watermarkPath: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Album)
    private readonly albumRepository: Repository<Album>,
    @InjectRepository(VideoFile)
    private readonly videoFileRepository: Repository<VideoFile>,
  ) {
    this.watermarkPath = path.join(__dirname, '../../public/images/watermark.png');
    if (!fs.existsSync(this.watermarkPath)) {
      throw new Error('Arquivo watermark.png não encontrado no caminho especificado.');
    }
  }

  // ── S3 & video processing ──

  async rotateVideo(inputBuffer: Buffer): Promise<Buffer> {
    const tempInputPath = path.join(__dirname, `temp_input_${uuidv4()}.mp4`);
    const tempOutputPath = path.join(__dirname, `temp_output_${uuidv4()}.mp4`);
    fs.writeFileSync(tempInputPath, inputBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .setFfmpegPath(require('@ffmpeg-installer/ffmpeg').path)
        .videoFilter('transpose=1')
        .on('end', () => {
          const rotatedBuffer = fs.readFileSync(tempOutputPath);
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(tempOutputPath);
          resolve(rotatedBuffer);
        })
        .on('error', (err) => {
          fs.unlinkSync(tempInputPath);
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          reject(`Erro ao rotacionar o vídeo: ${err.message}`);
        })
        .save(tempOutputPath);
    });
  }

  private async addWatermarkAndCompress(inputPath: string, outputPath: string): Promise<void> {
    const ffmpegArgs = [
      '-i', inputPath,
      '-i', this.watermarkPath,
      '-filter_complex', 'overlay=10:10',
      '-s', '720x1280',
      '-c:v', 'libx264',
      '-crf', '28',
      '-preset', 'fast',
      outputPath,
    ];

    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegPath!, ffmpegArgs);
      ffmpegProcess.on('error', (err) => reject(err));
      ffmpegProcess.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`FFmpeg terminou com o código ${code}`));
      });
    });
  }

  private async uploadToS3(fileName: string, fileBuffer: Buffer): Promise<string> {
    const mimeType = lookup(fileName) || 'application/octet-stream';

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: 'videos/' + fileName,
        Body: fileBuffer,
        ContentType: mimeType as string,
      }),
    );

    return `https://${this.configService.getOrThrow('AWS_BUCKET_NAME')}.s3.${this.configService.getOrThrow('AWS_BUCKET_REGION')}.amazonaws.com/${fileName}`;
  }

  async uploadFile(fileName: string, file: Buffer): Promise<{ url: string; fileName: string }> {
    const uuid = uuidv4();
    const fileExtension = fileName.split('.').pop();
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    const finalName = `${baseName}-${uuid}.${fileExtension}`;
    const finalNameWatermark = `wm-${baseName}-${uuid}.${fileExtension}`;

    const rotatedFile = await this.rotateVideo(file);

    const originalFilePath = path.join(__dirname, `temp_input_${uuidv4()}.mp4`);
    fs.writeFileSync(originalFilePath, rotatedFile);

    const optimizedFilePath = path.join(__dirname, `opt-temp_input_${uuidv4()}.mp4`);
    await this.addWatermarkAndCompress(originalFilePath, optimizedFilePath);

    const originalUrl = await this.uploadToS3(finalName, rotatedFile);

    const optimizedBuffer = fs.readFileSync(optimizedFilePath);
    await this.uploadToS3(finalNameWatermark, optimizedBuffer);

    fs.unlinkSync(originalFilePath);
    fs.unlinkSync(optimizedFilePath);

    return { url: originalUrl, fileName: finalName };
  }

  // ── Album operations ──

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  async findOrCreateAlbum(title: string, userId: number): Promise<Album> {
    const slug = this.generateSlug(title);

    let album = await this.albumRepository.findOne({
      where: { slug, fk_users: userId },
    });

    if (!album) {
      album = this.albumRepository.create({
        title,
        slug,
        fk_users: userId,
        is_active: true,
      });
      album = await this.albumRepository.save(album);
    }

    return album;
  }

  async getAlbumsByUser(userId: number): Promise<Album[]> {
    return this.albumRepository.find({
      where: { fk_users: userId, is_active: true },
      relations: ['videos'],
      order: { updated_at: 'DESC' },
    });
  }

  async getAlbumBySlug(slug: string): Promise<Album> {
    const album = await this.albumRepository.findOne({
      where: { slug, is_active: true },
      relations: ['videos'],
    });
    if (!album) {
      throw new NotFoundException('Álbum não encontrado');
    }
    return album;
  }

  // ── VideoFile operations ──

  async saveVideoToDatabase(fileName: string, url: string, albumId: string): Promise<VideoFile> {
    const video = this.videoFileRepository.create({
      file_name: fileName,
      original_url: url,
      album_id: albumId,
      status: true,
    });
    return this.videoFileRepository.save(video);
  }

  async deleteVideo(videoId: string): Promise<string> {
    const video = await this.videoFileRepository.findOne({ where: { id: videoId } });
    if (!video) {
      throw new NotFoundException('Vídeo não encontrado');
    }

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
          Key: 'videos/' + video.file_name,
        }),
      );

      await this.videoFileRepository.update({ id: videoId }, { status: false });
      return `Arquivo ${video.file_name} deletado com sucesso.`;
    } catch (error) {
      console.error(`Error deleting file ${video.file_name}:`, error);
      throw new Error('Failed to delete file from S3');
    }
  }

  async getVideosByAlbum(albumId: string): Promise<VideoFile[]> {
    return this.videoFileRepository.find({
      where: { album_id: albumId, status: true },
    });
  }
}
