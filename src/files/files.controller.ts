import { Body, Controller, Get, Param, ParseFilePipe, Post, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [],
      }),
    )
    files: Express.Multer.File[],
    @Body('album') albumTitle: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const album = await this.filesService.findOrCreateAlbum(albumTitle, userId);
    const responses = [];

    for (const file of files) {
      const { url, fileName } = await this.filesService.uploadFile(file.originalname, file.buffer);
      const video = await this.filesService.saveVideoToDatabase(fileName, url, album.id);

      responses.push({
        fileName: file.originalname,
        url,
        data: video,
      });
    }

    return {
      message: 'Uploads realizados com sucesso',
      album,
      uploads: responses,
    };
  }

  @Post('delete')
  async deleteVideo(@Body('videoId') videoId: string) {
    await this.filesService.deleteVideo(videoId);
  }

  @Get('albums')
  @UseGuards(JwtAuthGuard)
  async getUserAlbums(@Request() req) {
    const userId = req.user.userId;
    return this.filesService.getAlbumsByUser(userId);
  }

  @Get('albums/:slug')
  async getAlbumBySlug(@Param('slug') slug: string) {
    return this.filesService.getAlbumBySlug(slug);
  }

  @Get('albums/:albumId/videos')
  async getVideosByAlbum(@Param('albumId') albumId: string) {
    return this.filesService.getVideosByAlbum(albumId);
  }
}
