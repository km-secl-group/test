import { modelOptions, plugin, prop, Ref, mongoose, Severity } from '@typegoose/typegoose';
import mongooseLeanVirtuals from 'mongoose-lean-virtuals';
import {
    AddressSubdocument,
    ExternalIntegrationsSubdocument,
    SocialProfileSubdocument,
    EventDocument,
    SponsorDocument,
    SessionDocument,
    RegistrationDocument,
    PersonSubscriptionDocument,
    SubscriptionTierDocument,
    Resource,
    HubspotSubdocument,
    ZeristaSubdocument,
    RegfoxSubdocument,
    AventriSubdocument,
    GripSubdocument,
    PaperformSubdocument,
    Person6ConnexSubdocument,
    PersonKeyCloakSubdocument,
    PersonChatSubdocument,
    PersonEmailSubdocument,
} from '.';
import { createGetModelFunction } from './utils';
import {
    EventRegion,
    EventRoleEnum,
    PersonRegistrationStatusEnum,
    PersonSubscriptionStatus,
    SponsorAppRoles,
} from '../enums';

export class EmailSubdocument {
    @prop({ required: true, lowercase: true })
    emailAddress: string;

    @prop()
    type?: string;
}

export class PhoneNumbersSubdocument {
    @prop()
    mobile?: string;

    @prop()
    office?: string;

    @prop()
    home?: string;
}

export class PersonCompanySubdocument {
    @prop({ required: true })
    companyName: string;

    @prop()
    title?: string;

    @prop()
    function?: string;

    @prop()
    companySize?: string;
}

export class PersonEventConfigurationsSubdocument {
    @prop()
    'pending-meetings-max-allocate'?: number;

    @prop()
    'pending-meetings-count'?: number;
}

export class ExternalPersonStaffSubDocument {
    @prop()
    keycloak?: PersonKeyCloakSubdocument;
}

export class PersonStaffHistorySubdocument {
    @prop({ ref: () => SponsorDocument, required: true })
    sponsorId: Ref<SponsorDocument>;

    @prop({ ref: () => EventDocument, required: true })
    eventId: Ref<EventDocument>;

    @prop({ required: true })
    sponsorName: string;

    @prop({ default: false })
    active?: boolean = false;

    @prop({ default: [], enum: SponsorAppRoles, type: String })
    roles?: SponsorAppRoles[] = [SponsorAppRoles.Representative];

    @prop()
    external?: ExternalPersonStaffSubDocument;
}

export class PersonEventHistorySubdocument {
    @prop({ required: true, ref: () => EventDocument })
    eventId: Ref<EventDocument>;

    @prop({ required: true })
    eventName: string;

    @prop({
        required: true,
        default: ['none'],
        enum: EventRoleEnum,
        type: String,
    })
    role?: EventRoleEnum[] = [EventRoleEnum.none];

    @prop({ ref: () => SessionDocument })
    sessionIds?: Ref<SessionDocument>[];

    @prop()
    external?: ExternalIntegrationsSubdocument;

    @prop({ enum: PersonRegistrationStatusEnum })
    registrationStatus?: PersonRegistrationStatusEnum;

    @prop()
    registrationDate?: Date;

    @prop({ ref: () => RegistrationDocument })
    registrationId?: Ref<RegistrationDocument>;

    @prop({ ref: () => SponsorDocument })
    sponsorId?: Ref<SponsorDocument>;

    @prop()
    passType?: string;

    // If defined, it will override the Company's Offers
    @prop({ default: [] })
    offers?: string[] = [];

    // If defined, it will override the Company's Seeks
    @prop({ default: [] })
    seeks?: string[] = [];

    @prop({ default: [] })
    interests?: string[] = [];

    @prop({ required: false, ref: () => PersonDocument })
    personNotInterested?: Ref<PersonDocument>[];

    @prop({ required: false, ref: () => PersonDocument })
    personConnected?: Ref<PersonDocument>[];

    @prop({ required: false, default: [], ref: () => SponsorDocument })
    sponsorInterested?: Ref<SponsorDocument>[] = [];

    @prop()
    availableWindowStart?: number; // number of seconds since midnight

    @prop()
    availableWindowEnd?: number; // number of seconds since midnight

    @prop({ default: false })
    onboarded?: boolean = false;

    @prop({ default: true })
    agreesGDPRConsent?: boolean = true;

    @prop({ default: true })
    acceptsReceivingEmails?: boolean = true;

    @prop({ default: false })
    agreesTermsAndConditions?: boolean = false;

    @prop({ default: false })
    isVendor?: boolean = false;

    @prop()
    defaultRegion?: string;

    @prop({ default: false })
    excludeFromRecommendations?: boolean = false;

    @prop({ default: {} })
    configurations?: PersonEventConfigurationsSubdocument = {};

    @prop({ default: new Map([]), type: mongoose.Schema.Types.Mixed })
    data?: Map<string, any> = new Map([]);

    @prop()
    onboardingDate?: Date;
}

/**
 * This sub-document should be used as a quick reference for people's subscriptions.
 */
export class PersonSubscriptionSubdocument {
    @prop({ ref: () => PersonSubscriptionDocument, required: true })
    subscriptionId: Ref<PersonSubscriptionDocument>;

    @prop({ required: true })
    subscriptionName: string;

    @prop({ required: true, enum: PersonSubscriptionStatus })
    status: PersonSubscriptionStatus;

    @prop({ ref: () => SubscriptionTierDocument, required: true })
    tier: Ref<SubscriptionTierDocument>;

    @prop()
    external?: ExternalIntegrationsSubdocument;
}

@plugin(mongooseLeanVirtuals)
@modelOptions({
    schemaOptions: {
        collection: 'people',
        timestamps: true,
        strict: true,
    },
    options: {
        allowMixed: Severity.WARN,
    },
})
export class PersonDocument extends Resource {
    @prop({ required: true, index: true })
    firstName: string;

    @prop({ required: true, index: true })
    lastName: string;

    @prop({ type: () => [EmailSubdocument] })
    emailAddresses?: EmailSubdocument[];

    @prop()
    phoneNumbers?: PhoneNumbersSubdocument;

    @prop({ type: () => [PersonCompanySubdocument] })
    companies?: PersonCompanySubdocument[];

    @prop()
    activeCompany?: PersonCompanySubdocument;

    @prop()
    gender?: string;

    @prop()
    ethnicity?: string;

    @prop()
    bio?: string;

    @prop()
    social?: SocialProfileSubdocument;

    @prop()
    address?: AddressSubdocument;

    @prop()
    profileImage?: string;

    @prop({ type: () => [PersonEventHistorySubdocument] })
    eventHistory?: PersonEventHistorySubdocument[];

    @prop({ type: () => [PersonSubscriptionSubdocument], default: [] })
    subscriptionsHistory?: PersonSubscriptionSubdocument[] = [];

    @prop({ type: () => [PersonStaffHistorySubdocument], default: [] })
    staffHistory?: PersonStaffHistorySubdocument[] = [];
}

export const createPersonModel = createGetModelFunction(PersonDocument);
