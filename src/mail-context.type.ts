type SessionCreatedEmailContent = {
    classTitle: string,
    sessionTitle: string,
    startDatetime: string,
    endDatetime: string,
    createdAt: string,
    urlToSession: string,
};

type SessionFeedbackUpdatedEmailContent = {
    classTitle: string,
    sessionTitle: string,
    urlToSession: string,
    feedbackText: string,
};

type SessionCancelledEmailContent = {
    classTitle: string,
    sessionTitle: string,
    urlToSession: string,
    cancellationReason: string,
};

type NewTutoringRequestEmailContent = {
    classTitle: string,
    urlToClass: string,
};

type NewClassApplicationEmailContent = {
    classTitle: string,
    urlToClass: string,
    tutorName: string,
    urlToTutor: string,
};

type ClassApplicationAcceptedEmailContent = {
    urlToCourse: string,
    urlToMyClasses: string,
};

type TutoringRequestAcceptedEmailContent = {
    tutorName: string,
    urlToCourse: string,
    urlToMyClasses: string,
};

type MailContext = {
    name: string,
    url?: string,
    newPassword?: string,
} | SessionCreatedEmailContent & {
    name: string,
} | SessionFeedbackUpdatedEmailContent & {
    name: string,
} | SessionCancelledEmailContent & {
    name: string,
} | NewTutoringRequestEmailContent & {
    name: string,
} | NewClassApplicationEmailContent & {
    name: string,
} | ClassApplicationAcceptedEmailContent & {
    name: string,
} | TutoringRequestAcceptedEmailContent & {
    name: string,
};