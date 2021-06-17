import { modelOptions, prop, Ref } from '@typegoose/typegoose';
import { Schema } from 'mongoose';
import { EventDocument } from './event';
import { TaskDocument } from './tasks';
import { UserDocument } from './user.model';
import { createGetModelFunction } from './utils';
import { PersonDocument } from './person.model';
import { Resource } from './_base.model';


@modelOptions({
    schemaOptions: {
        collection: 'submissions',
        timestamps: true,
    },
})
export class SubmissionDocument extends Resource {
    // Tasks Model
    @prop({ required: true, ref: () => TaskDocument })
    task: Ref<TaskDocument>;

    @prop({ default: 0 })
    version?: number = 0;

    /**
     * Textual content for text type task.
     * Storage URL for image, video & document task.
     * Array of Ids for Pass & Speaker Selection
     */
    @prop({ required: true })
    content: string | string[] | Schema.Types.ObjectId[] | { [key: string]: any };

    @prop({ default: true })
    active?: boolean = true;

    @prop({ required: true, refPath: 'owner' })
    owner: Ref<UserDocument | PersonDocument>;

    @prop({ required: true, ref: () => EventDocument })
    event: Ref<EventDocument>;
}

export const createSubmissionModel = createGetModelFunction(SubmissionDocument);
