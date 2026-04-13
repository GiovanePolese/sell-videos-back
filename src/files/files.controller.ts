import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, Param, ParseFilePipe, Post, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', 10))
  async uploadFiles(
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          // new MaxFileSizeValidator({ maxSize: 1000 }),
          // new FileTypeValidator({ fileType: 'image/jpeg' }),
        ],
      }),
    ) 
    files: Express.Multer.File[],
  ) {
    const responses = [];

    for (const file of files) {
      // Upload do arquivo para o S3
      const { url, fileName } = await this.filesService.upload(file.originalname, file.buffer);

      // Salvar no banco de dados
      const upload = await this.filesService.saveToDatabase(fileName, url);

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
  async getActiveImages(@Param('fkUser') fkUser: number) {
    return this.filesService.getActiveImagesByUser(fkUser);
  }
}
