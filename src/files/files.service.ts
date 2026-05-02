import { PutObjectCommand,DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import * as ffmpeg from 'fluent-ffmpeg';
import { Files as FilesEntity } from './entities/files.entity';
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
    region: "auto",
    endpoint: this.configService.getOrThrow('AWS_ENDPOINT'),
    credentials: {
      accessKeyId: this.configService.getOrThrow('AWS_ACCESS_KEY'),
      secretAccessKey: this.configService.getOrThrow('AWS_SECRET_KEY'),
    },
    forcePathStyle: true
  });

  private readonly watermarkPath: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FilesEntity)
    private readonly uploadRepository: Repository<FilesEntity>,
  ) {
    // Define o caminho absoluto para a marca d'água
    this.watermarkPath = path.join(__dirname, '../../public/images/watermark.png');

    // Verifica se a marca d'água existe ao inicializar o serviço
    if (!fs.existsSync(this.watermarkPath)) {
      throw new Error('Arquivo watermark.png não encontrado no caminho especificado.');
    }
  }

  async rotateVideo(inputBuffer: Buffer): Promise<Buffer> {
    const tempInputPath = path.join(__dirname, `temp_input_${uuidv4()}.mp4`);
    const tempOutputPath = path.join(__dirname, `temp_output_${uuidv4()}.mp4`);

    // Escreve o buffer para um arquivo temporário
    fs.writeFileSync(tempInputPath, inputBuffer);

    return new Promise((resolve, reject) => {
      ffmpeg(tempInputPath)
        .setFfmpegPath(require('@ffmpeg-installer/ffmpeg').path)
        .videoFilter('transpose=1') // Rotação de 90 graus no sentido horário
        .on('end', () => {
          const rotatedBuffer = fs.readFileSync(tempOutputPath);
          // Remove os arquivos temporários
          fs.unlinkSync(tempInputPath);
          fs.unlinkSync(tempOutputPath);
          resolve(rotatedBuffer);
        })
        .on('error', (err) => {
          // Remove os arquivos temporários em caso de erro
          fs.unlinkSync(tempInputPath);
          if (fs.existsSync(tempOutputPath)) fs.unlinkSync(tempOutputPath);
          reject(`Erro ao rotacionar o vídeo: ${err.message}`);
        })
        .save(tempOutputPath);
    });
  }

  private async addWatermarkAndCompress(
    inputPath: string,
    outputPath: string,
  ): Promise<void> {
    const ffmpegArgs = [
      '-i', inputPath,                   // Entrada: vídeo original
      '-i', this.watermarkPath,          // Entrada: marca d'água
      '-filter_complex', 'overlay=10:10', // Marca d'água no canto superior esquerdo
      '-s', '720x1280',                   // Reduz a resolução para 640x360
      '-c:v', 'libx264',                 // Codec para compressão eficiente
      '-crf', '28',                      // Reduz qualidade para otimizar tamanho
      '-preset', 'fast',                 // Configuração para velocidade
      outputPath,                        // Saída: vídeo otimizado
    ];

    return new Promise((resolve, reject) => {
      const ffmpegProcess = spawn(ffmpegPath!, ffmpegArgs);

      ffmpegProcess.on('error', (err) => reject(err));
      ffmpegProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg terminou com o código ${code}`));
        }
      });
    });
  }
  private async uploadToS3(
    fileName: string,
    fileBuffer: Buffer,
  ): Promise<string> {
    const mimeType = lookup(fileName) || 'application/octet-stream'; // Detecta o MIME Type

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

  async upload(fileName: string, file: Buffer): Promise<{ url: string; fileName: string }>{
    const uuid = uuidv4();
    const fileExtension = fileName.split('.').pop();
    const baseName = fileName.replace(/\.[^/.]+$/, "");
    const finalName = `${baseName}-${uuid}.${fileExtension}`;
    const finalNameWatermark = `wm-${baseName}-${uuid}.${fileExtension}`;

    // Rotaciona o vídeo antes de enviar para o S3
    const rotatedFile = await this.rotateVideo(file);

    // Salva o arquivo original localmente
    const originalFilePath = path.join(__dirname, `temp_input_${uuidv4()}.mp4`);
    fs.writeFileSync(originalFilePath, rotatedFile);

    // Define o caminho para o vídeo otimizado
    const optimizedFilePath = path.join(__dirname, `opt-temp_input_${uuidv4()}.mp4`);

    // Processa o vídeo para adicionar a marca d'água e reduzir a resolução
    await this.addWatermarkAndCompress(originalFilePath, optimizedFilePath);

    // Upload do arquivo original
    const originalUrl = await this.uploadToS3(finalName, rotatedFile);

    // Upload do arquivo otimizado
    const optimizedBuffer = fs.readFileSync(optimizedFilePath);
    await this.uploadToS3(finalNameWatermark, optimizedBuffer);

    // Limpa os arquivos locais temporários
    fs.unlinkSync(originalFilePath);
    fs.unlinkSync(optimizedFilePath);

    return {
      url: originalUrl,
      fileName: finalName
    };
  }

  async saveToDatabase(filename: string, url: string, userId: number, album: string): Promise<FilesEntity|string> {
    const newUpload = this.uploadRepository.create({
      fk_users: userId,
      image_name: filename,
      image_url: url,
      album,
      date: new Date(),
      status: true,
    });
    return this.uploadRepository.save(newUpload);
  }

  async deleteFile(fileId: number): Promise<string> {
    const fileName = await this.getFileNameById(fileId);

    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.getOrThrow('AWS_BUCKET_NAME'),
          Key: 'videos/' + fileName,
        }),
      );

      await this.uploadRepository.update({ id: fileId }, { status: false });
      return `Arquivo ${fileName} deletado com sucesso.`;

    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
      throw new Error('Failed to delete file from S3');
    }
  }

  async getIdByFileName(fileName: string): Promise<number | null> {
    const upload = await this.uploadRepository.findOne({
      where: { image_name: fileName },
      select: ['id'],
    });
  
    return upload ? upload.id : null;
  }

  async getFileNameById(id: number): Promise<string | null> {
    const upload = await this.uploadRepository.findOne({
      where: { id },
      select: ['image_name'],
    });
  
    return upload ? upload.image_name : null;
  }

  async getActiveImagesByUser(fkUser: number, album?: string): Promise<FilesEntity[]> {
    const where: any = {
      fk_users: fkUser,
      status: true,
    };
    if (album) {
      where.album = album;
    }
    return this.uploadRepository.find({ where });
  }

  async getAlbumsByUser(userId: number): Promise<{ album: string; count: number; latestDate: string }[]> {
    const results = await this.uploadRepository
      .createQueryBuilder('file')
      .select('file.album', 'album')
      .addSelect('COUNT(*)', 'count')
      .addSelect('MAX(file.date)', 'latestDate')
      .where('file.fk_users = :userId', { userId })
      .andWhere('file.status = :status', { status: true })
      .groupBy('file.album')
      .orderBy('latestDate', 'DESC')
      .getRawMany();

    return results.map((r) => ({
      album: r.album,
      count: Number(r.count),
      latestDate: r.latestDate,
    }));
  }
}
