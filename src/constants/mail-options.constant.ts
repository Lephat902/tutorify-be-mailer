import { ISendMailOptions } from "@nestjs-modules/mailer";
import { PATH_TO_TEMPLATES_DIR } from "./path-to-templates.constant";

export enum MailType {
    EMAIL_CONFIRMATION,
    RESET_PASSWORD,
    TUTOR_APPROVED,
    TUTOR_REJECTED,
    SEND_NEW_PASSWORD,
    CLASS_SESSION_CREATED,
    CLASS_SESSION_FEEDBACK_UPDATED,
    TUTORING_REQUEST_CREATED, // class application created by student
    CLASS_APPLICATION_CREATED, // class application created by tutor
    TUTORING_REQUEST_ACCEPTED,
    CLASS_APPLICATION_ACCEPTED,
    TUTOR_APPLICATION_RECEIVED,
}

export const MailOptions: Record<
    MailType,
    Pick<ISendMailOptions, 'from' | 'subject' | 'template' | 'attachments'>
>
    = {
    [MailType.EMAIL_CONFIRMATION]: {
        from: '"Support Team" <noreply@tutorify.site>',
        subject: 'Welcome to Tutorify! Confirm your Email',
        template: './confirmation',
    },
    [MailType.RESET_PASSWORD]: {
        from: '"Support Team" <noreply@tutorify.site>',
        subject: 'Reset Password',
        template: './reset-password',
    },
    [MailType.TUTOR_APPROVED]: {
        from: '"HR Team" <noreply@tutorify.site>',
        subject: 'Inform application status',
        template: './approve-tutor',
    },
    [MailType.TUTOR_REJECTED]: {
        from: '"HR Team" <noreply@tutorify.site>',
        subject: 'Inform application status',
        template: './reject-tutor',
    },
    [MailType.SEND_NEW_PASSWORD]: {
        from: '"Support Team" <noreply@tutorify.site>',
        subject: 'Your Password Reset Request',
        template: './send-new-password',
    },
    [MailType.CLASS_SESSION_CREATED]: {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: 'New class session',
        template: './session-created',
    },
    [MailType.CLASS_SESSION_FEEDBACK_UPDATED]: {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: 'Class Session Feedback Updated',
        template: './session-feedback-updated',
    },
    [MailType.TUTORING_REQUEST_CREATED]: {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: 'New Tutoring Request Received',
        template: './notify-tutoring-request-to-tutor',
    },
    [MailType.CLASS_APPLICATION_CREATED]: {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: 'New Class Application Received',
        template: './notify-class-application-to-student',
    },
    [MailType.TUTORING_REQUEST_ACCEPTED]: {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: 'Tutoring Request Accepted',
        template: './notify-tutoring-request-accepted',
    },
    [MailType.CLASS_APPLICATION_ACCEPTED]: {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: 'Class Application Accepted',
        template: './notify-class-application-accepted',
    },
    [MailType.TUTOR_APPLICATION_RECEIVED]: {
        from: '"Tutorify" <noreply@tutorify.site>',
        subject: 'Application Received',
        template: './tutor-application-received',
    },
}

Object.values(MailOptions).forEach(mailOption => {
    mailOption.attachments = [{
        filename: 'tutorify-logo.png',
        path: `${PATH_TO_TEMPLATES_DIR}/images/tutorify-logo.png`,
        cid: 'tutorify-logo'
    }];
});
