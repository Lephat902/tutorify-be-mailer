import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';
import { MailService } from '../mail.service';
import { UserDto } from 'src/dto/user.dto';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) { }

  @MessagePattern({ cmd: 'sendUserConfirmation' })
  async sendUserConfirmation(data: { user: UserDto; token: string }) {
    const { user, token } = data;
    await this.mailService.sendUserConfirmation(user, token);
    return true;
  }

  @MessagePattern({ cmd: 'sendNewPassword' })
  async sendNewPassword(data: { user: UserDto; newPassword: string }) {
    const { user, newPassword } = data;
    await this.mailService.sendNewPassword(user, newPassword);
    return true;
  }
}
