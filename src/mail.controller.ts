import { Controller } from '@nestjs/common';
import { EventPattern } from '@nestjs/microservices';
import { MailService } from './mail.service';
import { UserDto } from 'src/dto/user.dto';

@Controller()
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @EventPattern({ cmd: 'sendUserConfirmation' })
  async sendUserConfirmation(data: { user: UserDto; token: string }) {
	console.log(data);
    const { user, token } = data;
    await this.mailService.sendUserConfirmation(user, token);
  }
}
