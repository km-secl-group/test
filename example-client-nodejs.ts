import { BadRequestError, Body, JsonController, NotFoundError, OnUndefined, Post } from 'routing-controllers';
import { TasksResourceService } from '../services/tasks.resource-service';
import { SubmissionResourceService } from '../services/submission.resource-service';
import { StatusCodes } from 'http-status-codes';
import { ResponseHandler } from '@nextcustomer/adk/lib/common';
import {
    ActionType,
    CommentDocument,
    CommentType,
    PersonDocument,
    SubmissionDocument,
    TaskDocument,
    TaskStatus,
    TaskType,
    UserMinimalisticSubdocument,
} from '@nextcustomer/next-ems-core';
import { Authorize } from '../utils/decorators';
import { Auth } from '../dtos/auth';
import { CreateSubmissionDto } from '../dtos/create-submission.dto';
import { Types } from 'mongoose';
import { CommentResourceService } from '../services/comment.resource-service';
import { CommentDto } from '../dtos/comment.dto';
import { TaskDefinitionResourceService } from '../services/task-definition.resource-service';

@JsonController('tasks')
export class Class {
    constructor(
        private taskService: TasksResourceService,
        private submissionService: SubmissionResourceService,
        private commentService: CommentResourceService,
        private taskDefinitionService: TaskDefinitionResourceService,
    ) {}

    @OnUndefined(StatusCodes.NOT_FOUND)
    @Post('/submissions', { transformResponse: false })
    async upsertSubmission(@Authorize() auth: Auth, @Body() createSubmissionDto: CreateSubmissionDto) {
        let task = await this.taskService.get(createSubmissionDto.taskId);

        if (!task) {
            throw new NotFoundError('task not found');
        }

        const taskDefinition = await this.taskDefinitionService.get(task.taskDefinition);

        if (!taskDefinition) {
            throw new NotFoundError('Task Definition not found');
        }

        if (String(auth.event._id) !== String(task.event)) {
            throw new BadRequestError('This task has a different event id assigned');
        }

        if (task.type === TaskType.reminderTask) {
            await this.taskService.update(task._id, { status: TaskStatus.Done });
            return ResponseHandler.ok();
        }

        const oldSubmission = await this.submissionService.get(createSubmissionDto.submissionId);

        const newSubmission = new SubmissionDocument();
        newSubmission.content = createSubmissionDto.content;
        newSubmission.task = task._id;
        newSubmission.owner = (auth.person._id as unknown) as PersonDocument;
        newSubmission.event = auth.event._id as Types.ObjectId;
        newSubmission.version = (oldSubmission?.version || 0) + 1;
        const oldSubmissions = await this.submissionService.findAll({ task: task._id, active: true });
        for await (const oldSubmission of oldSubmissions) {
            await this.submissionService.update(oldSubmission._id, { active: false });
        }
        const submission = await this.submissionService.create(newSubmission);

        await this.taskService.update(task._id, { draft: createSubmissionDto.isDraft });

        if (createSubmissionDto.isDraft) {
            task = await this.taskService.update(task._id, { status: TaskStatus.InProgress });
        } else if (!taskDefinition.needsApproval) {
            task = await this.taskService.update(task._id, { status: TaskStatus.Done });
        }

        if (!createSubmissionDto.isDraft) {
            await this.taskDefinitionService.executeFulfillment({
                auth,
                task: task as TaskDocument,
                taskDefinition,
                submission,
            });
        }

        return ResponseHandler.created(submission);
    }

    @OnUndefined(StatusCodes.NOT_FOUND)
    @Post('/comments', { transformResponse: false })
    async addComment(@Authorize() auth: Auth, @Body() commentDto: CommentDto) {
        const task = await this.taskService.get(commentDto.taskId);

        if (!task) {
            throw new NotFoundError('task not found');
        }

        if (String(auth.event._id) !== String(task.event)) {
            throw new BadRequestError('This task has a different event id assigned');
        }

        const newComment = new CommentDocument();

        if (task.draft) {
            newComment.action = ActionType.draftComment;
        }

        newComment.targetId = task._id;
        newComment.commentType = CommentType.sponsorComment;
        newComment.targetType = 'task';
        newComment.event = auth.event._id;

        newComment.owner = new UserMinimalisticSubdocument(
            auth.person._id!,
            auth.person.firstName,
            auth.person.lastName,
            auth.person._id!,
        );

        newComment.comment = commentDto.value;

        const comment = await this.commentService.create(newComment);
        return ResponseHandler.created(comment);
    }
}
