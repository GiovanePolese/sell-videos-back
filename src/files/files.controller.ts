import { Body, Controller, Get, Param, ParseFilePipe, Post, Query, Request, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
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
    @Body('album') album: string,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const responses = [];

    for (const file of files) {
      const { url, fileName } = await this.filesService.upload(file.originalname, file.buffer);
      const upload = await this.filesService.saveToDatabase(fileName, url, userId, album);

      responses.push({
        fileName: file.originalname,
        url,
        data: upload,
      });
    }

    return {
      message: 'Uploads realizados com sucesso',
      uploads: responses,
    };
  }

  @Post('delete')
  async deleteFile(@Body('imageId') imageId: number) {
    await this.filesService.deleteFile(imageId);
  }

  @Get('user/:fkUser/active')
  async getActiveImages(
    @Param('fkUser') fkUser: number,
    @Query('album') album?: string,
  ) {
    return this.filesService.getActiveImagesByUser(fkUser, album);
  }

  @Get('albums')
  @UseGuards(JwtAuthGuard)
  async getUserAlbums(@Request() req) {
    const userId = req.user.userId;
    return this.filesService.getAlbumsByUser(userId);
  }
}
