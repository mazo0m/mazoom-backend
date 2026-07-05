import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Registered email address',
    example: 'aiman@mazoom.app',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({
    description: 'Account password',
    example: 'Str0ng!Pass#2025',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
