import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PATH_TO_TEMPLATES_DIR } from './constants';
import { Controllers } from './controllers';
import { MailService } from './mail.service';
import { APIGatewayProxy } from './proxies';

@Module({
  imports: [
    HttpModule,
    ConfigModule.forRoot({
      isGlobal: true, // no need to import into other modules
      envFilePath: ['.env', '.env.example'],
    }),
    MailerModule.forRootAsync({
      useFactory: async (config: ConfigService) => ({
        transport: {
          host: config.get('MAIL_HOST'),
          port: 465,
          secure: true,
          auth: {
            user: config.get('MAIL_USER'),
            pass: config.get('MAIL_PASSWORD'),
          },
        },
        defaults: {
          from: `"No Reply" <${config.get('MAIL_FROM')}>`,
        },
        template: {
          dir: PATH_TO_TEMPLATES_DIR,
          adapter: new HandlebarsAdapter(undefined, {
            inlineCssOptions: {
              baseUrl: 'file://' + PATH_TO_TEMPLATES_DIR + '/styles.css',
            },
          }),
          options: {
            strict: true,
          },
        },
        options: {
          partials: {
            dir: PATH_TO_TEMPLATES_DIR + '/common',
            options: {
              strict: true,
            },
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [MailService, APIGatewayProxy],
  controllers: Controllers,
})
export class AppModule { }
