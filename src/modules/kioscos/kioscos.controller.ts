// kioscos/kioscos.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { KioscosService } from './kioscos.service';
import { CreateKioscoDto } from './dto/create-kiosco.dto';
import { Public } from '../../common/decorators/public.decorator';

@Public()
@Controller('kioscos')
export class KioscosController {
  constructor(private readonly kioscosService: KioscosService) {}
  @Public()
  @Get()
  findAll() {
    return this.kioscosService.findAll();
  }
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.kioscosService.findOne(id);
  }
  @Public()
  @Post()
  create(@Body() createKioscoDto: CreateKioscoDto) {
    return this.kioscosService.create(createKioscoDto);
  }
  @Public()
  @Put(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<CreateKioscoDto>) {
    return this.kioscosService.update(id, updateData);
  }
  @Public()
  @Delete(':id')
  delete(@Param('id') id: string) {
    this.kioscosService.delete(id);
    return { message: 'Kiosco eliminado correctamente' };
  }
}
