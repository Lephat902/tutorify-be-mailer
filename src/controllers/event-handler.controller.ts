import { Controller } from "@nestjs/common";
import { EventPattern } from "@nestjs/microservices";
import {
  ApplicationStatus,
  ClassApplicationCreatedEventPattern,
  ClassApplicationCreatedEventPayload,
  ClassApplicationUpdatedEventPattern,
  ClassApplicationUpdatedEventPayload,
  ClassSessionUpdatedEventPattern,
  ClassSessionUpdatedEventPayload,
  MultiClassSessionsCreatedEventPattern,
  MultiClassSessionsCreatedEventPayload,
  TutorApprovedEventPattern,
  TutorApprovedEventPayload,
  TutorRejectedEventPattern,
  TutorRejectedEventPayload,
  UserCreatedEventPattern,
  UserCreatedEventPayload,
  UserRole,
} from "@tutorify/shared";
import { EventAttributes, createEvents } from "ics";
import { APIGatewayProxy } from "src/proxies";
import { MailService } from "../mail.service";
import { UserDto } from "src/dto/user.dto";

@Controller()
export class EventHandler {
  constructor(
    private readonly mailService: MailService,
    private readonly _APIGatewayProxy: APIGatewayProxy
  ) {}

  @EventPattern(new UserCreatedEventPattern())
  async handleUserCreated(payload: UserCreatedEventPayload) {
    const { role } = payload;
    if (role === UserRole.TUTOR) {
      await this.handleTutorCreated(payload);
    }
  }

  private async handleTutorCreated(payload: UserCreatedEventPayload) {
    const { email, firstName, middleName, lastName } = payload;
    const fullName = `${firstName} ${middleName} ${lastName}`;
    console.log(
      `Start sending tutor-application received email to tutor ${fullName}`
    );

    await this.mailService.sendTutorApplicationReceived({
      email,
      name: fullName,
    });
  }

  @EventPattern(new TutorApprovedEventPattern())
  async handleTutorApproved(payload: TutorApprovedEventPayload) {
    const { email, firstName, middleName, lastName } = payload;
    const fullName = `${firstName} ${middleName} ${lastName}`;
    console.log(`Start sending tutor approved email to user ${fullName}`);

    await this.mailService.sendTutorApproved({
      email,
      name: fullName,
    });
  }

  @EventPattern(new TutorRejectedEventPattern())
  async handleTutorRejected(payload: TutorRejectedEventPayload) {
    const { email, firstName, middleName, lastName } = payload;
    const fullName = `${firstName} ${middleName} ${lastName}`;
    console.log(`Start sending tutor rejected email to user ${fullName}`);

    await this.mailService.sendTutorRejected({
      email,
      name: fullName,
    });
  }

  @EventPattern(new MultiClassSessionsCreatedEventPattern())
  async handleClassSessionCreated(
    payload: MultiClassSessionsCreatedEventPayload
  ) {
    const { classId, classSessionId, sessionsDetails, createdAt, tutorId } =
      payload;
    const numOfSessionsCreatedInBatch = sessionsDetails.length;
    console.log(`Start sending session-created notifications`);
    const classData =
      await this._APIGatewayProxy.getDataBySessionEventsHandler(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const urlToSession = `https://www.tutorify.site/courses/${classId}/mysessions/${classSessionId}`;

    const firstSession = sessionsDetails[0];

    const tutorData = await this._APIGatewayProxy.getTutorDatabyId(tutorId);
    const tutor = tutorData.tutor;
    const tutorFullName = `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`;

    const events = this.generateICSEventsForCreatedSessions(
      sessionsDetails,
      classData
    ) as EventAttributes[];

    const { value, error } = createEvents(events);

    if (error) return;

    console.log("value ", value);

    const recipients: UserDto[] = [
      {
        email: student.email,
        name: studentFullName,
      },
      {
        email: tutor.email,
        name: tutorFullName,
      },
    ];

    await Promise.all(
      recipients.map((recipient) =>
        this.mailService.sendSessionCreated(
          recipient,
          {
            classTitle: classData.class.title,
            sessionTitle: firstSession.title,
            startDatetime: new Date(firstSession.startDatetime).toUTCString(),
            endDatetime: new Date(firstSession.endDatetime).toUTCString(),
            createdAt: new Date(createdAt).toUTCString(),
            urlToSession,
            numOfOtherSessionsCreatedInBatch: numOfSessionsCreatedInBatch - 1,
          },
          [
            {
              filename: "events.ics",
              content: value,
            },
          ]
        )
      )
    );
  }

  @EventPattern(new ClassSessionUpdatedEventPattern())
  async handleClassSessionUpdated(payload: ClassSessionUpdatedEventPayload) {
    const {
      classId,
      classSessionId,
      title,
      updatedAt,
      feedbackUpdatedAt,
      tutorFeedback,
      isCancelled,
    } = payload;
    const classData =
      await this._APIGatewayProxy.getDataBySessionEventsHandler(classId);
    const student = classData.class.student;
    const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
    const urlToSession = `https://www.tutorify.site/courses/${classId}/mysessions/${classSessionId}`;

    if (!isCancelled && updatedAt && updatedAt === feedbackUpdatedAt) {
      console.log(`Start sending session-feedback-updated notifications`);
      await this.mailService.sendSessionFeedbackUpdated(
        {
          email: student.email,
          name: studentFullName,
        },
        {
          classTitle: classData.class.title,
          sessionTitle: title,
          urlToSession,
          feedbackText: tutorFeedback,
        }
      );
    } else if (isCancelled && updatedAt) {
      console.log(`Start sending session-cancelled notifications`);
      await this.mailService.sendSessionCancelled(
        {
          email: student.email,
          name: studentFullName,
        },
        {
          classTitle: classData.class.title,
          sessionTitle: title,
          urlToSession,
          cancellationReason: tutorFeedback,
        }
      );
    }
  }

  @EventPattern(new ClassApplicationCreatedEventPattern())
  async handleApplicationCreated(payload: ClassApplicationCreatedEventPayload) {
    const { classId, tutorId, isDesignated } = payload;
    const classAndTutor =
      await this._APIGatewayProxy.getDataByApplicationCreatedHandler(
        classId,
        tutorId
      );
    const urlToClass = `https://www.tutorify.site/classes/${classId}`;
    const tutor = classAndTutor.tutor;
    const tutorFullName = `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`;

    // Send email to tutor
    if (isDesignated) {
      await this.mailService.sendTutoringRequestCreated(
        {
          email: tutor.email,
          name: tutorFullName,
        },
        {
          classTitle: classAndTutor.class.title,
          urlToClass,
        }
      );
    }
    // Send email to student
    else {
      const urlToTutor = `https://www.tutorify.site/tutors/${tutorId}`;
      const student = classAndTutor.class.student;
      const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;
      await this.mailService.sendClassApplicationCreated(
        {
          email: student.email,
          name: studentFullName,
        },
        {
          classTitle: classAndTutor.class.title,
          urlToClass,
          tutorName: tutorFullName,
          urlToTutor,
        }
      );
    }
  }

  @EventPattern(new ClassApplicationUpdatedEventPattern())
  async handleApplicationStatusChanged(
    payload: ClassApplicationUpdatedEventPayload
  ) {
    const { classId, tutorId, newStatus, isDesignated } = payload;
    // Avoid unneccessary queries
    if (newStatus !== ApplicationStatus.APPROVED) return;
    const classAndTutor =
      await this._APIGatewayProxy.getDataByApplicationCreatedHandler(
        classId,
        tutorId
      );
    const urlToCourse = `https://www.tutorify.site/courses/${classId}`;
    const urlToMyClasses = "https://www.tutorify.site/myclasses";
    const tutor = classAndTutor.tutor;
    const tutorFullName = `${tutor.firstName} ${tutor.middleName} ${tutor.lastName}`;

    if (newStatus === ApplicationStatus.APPROVED) {
      const student = classAndTutor.class.student;
      const studentFullName = `${student.firstName} ${student.middleName} ${student.lastName}`;

      if (isDesignated) {
        // Notify student
        await this.mailService.sendTutoringRequestAccepted(
          {
            email: student.email,
            name: studentFullName,
          },
          {
            tutorName: tutorFullName,
            urlToCourse,
            urlToMyClasses,
          }
        );
      } else {
        // Notify tutor
        await this.mailService.sendClassApplicationAccepted(
          {
            email: tutor.email,
            name: tutorFullName,
          },
          {
            urlToCourse,
            urlToMyClasses,
          }
        );
      }
    }
  }

  generateICSEventsForCreatedSessions(
    sessionsDetails: {
      readonly title: string;
      readonly startDatetime: Date;
      readonly endDatetime: Date;
    }[],
    classData: Class
  ) {
    return sessionsDetails.map((sessionsDetail) => ({
      start: this.getTimeInVietnamFromDateTime(
        sessionsDetail.startDatetime
      ).getTime(),
      startInputType: "utc",
      startOutputType: "utc",
      endInputType: "utc",
      endOutputType: "utc",
      end: this.getTimeInVietnamFromDateTime(
        sessionsDetail.endDatetime
      ).getTime(),
      title: classData.class.title,
      description: sessionsDetail.title,
      status: "TENTATIVE",
    }));
  }

  getTimeInVietnamFromDateTime(date: Date) {
    const dateObj = new Date(date);
    const timezoneOffset = dateObj.getTimezoneOffset();
    const vnOffset = -420;
    return new Date(
      dateObj.getTime() + (vnOffset + timezoneOffset) * 60 * 1000
    );
  }
}
