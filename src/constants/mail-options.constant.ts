import { ISendMailOptions } from "@nestjs-modules/mailer";
import { PATH_TO_TEMPLATES_DIR } from "./path-to-templates.constant";

export enum MailType {
    EMAIL_CONFIRMATION,
    TUTOR_APPROVED,
    TUTOR_REJECTED,
    SEND_NEW_PASSWORD,
}

export const MailOptions: Record<
    MailType,
    Pick<ISendMailOptions, 'from' | 'subject' | 'template' | 'attachments'>
>
    = {
    [MailType.EMAIL_CONFIRMATION]: {
        from: '"Support Team" <noreply@tutorify.com>',
        subject: 'Welcome to Tutorify! Confirm your Email',
        template: './confirmation',
    },
    [MailType.TUTOR_APPROVED]: {
        from: '"HR Team" <noreply@tutorify.com>',
        subject: 'Inform application status',
        template: './approve-tutor',
    },
    [MailType.TUTOR_REJECTED]: {
        from: '"HR Team" <noreply@tutorify.com>',
        subject: 'Inform application status',
        template: './reject-tutor',
    },
    [MailType.SEND_NEW_PASSWORD]: {
        from: '"Support Team" <noreply@tutorify.com>',
        subject: 'Your Password Reset Request',
        template: './send-new-password',
    },
}

Object.values(MailOptions).forEach(mailOption => {
    mailOption.attachments = [{
        filename: 'tutorify-logo.png',
        path: `${PATH_TO_TEMPLATES_DIR}/images/tutorify-logo.png`,
        cid: 'tutorify-logo'
    }];
});
