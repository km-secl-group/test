import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { Grid } from 'react-styled-flexboxgrid';
import { Dropdown, Input, Spinner } from '@nextcustomer/rdk';
import { SpinnerWrapper, StyledRow } from '../CompanyProfile/CompanyProfile.styled';
import { baseProps, colProps } from '../CompanyProfile/util';
import { useMount, useToggle } from 'react-use';
import { TaskType } from '@nextcustomer/next-ems-core/lib/enums';
import { StyledAddNewUser } from '../Attachments/Attachments.styled';
import { DropdownWrapper, ErrorClearance, NewPersonFormContainer, StyledCol } from './NewPersonForm.styled';
import { Container } from './SubmissionModal.styled';
import { TaskRegisterDtoPerson, TaskRegisterPerson } from '../../../model/task.model';
import { debounce as _debounce, isEmpty as _isEmpty } from 'lodash-es';
import NewPersonTable from './NewPersonTable';
import { calculateSelectedPasses, emptyPerson } from './util';
import { Task } from '../../../model';
import { useDispatch, useSelector } from 'react-redux';
import { ThemeContext } from 'styled-components';
import {
    getEventTickets,
    selectPassSelectionData,
    selectPassSelectionLoadingStatus,
    selectSponsor,
} from '../../../store/reducers/sponsor.reducer';
import validationNewPassSchema from './validation-scheme';

interface Props {
    task: Task;
    submitNewPerson: (newPerson: TaskRegisterPerson) => void;
    content: TaskRegisterPerson[];
    onRowSelect: (index: number, value: boolean) => void;
    submit: React.Dispatch<any>;
    onDeletePerson: (index: number) => void;
    onEditTicketPass: (index: number, value: TaskRegisterPerson) => void;
}

const NewPersonForm: FC<Props> = ({
    task,
    submitNewPerson,
    onRowSelect,
    content,
    submit,
    onDeletePerson,
    onEditTicketPass,
}: Props) => {
    const [showForm, toggleShowForm] = useToggle(false);
    const [newPerson, setNewPerson] = useState<TaskRegisterDtoPerson>(emptyPerson());
    const dispatch = useDispatch();
    const passIsLoading = useSelector(selectPassSelectionLoadingStatus);
    const sponsor = useSelector(selectSponsor);
    const passData = useSelector(selectPassSelectionData);
    const themeContext = useContext(ThemeContext);
    const formattedPassData = passData.map((pass) => ({ label: pass.name, value: pass._id }));
    const [editMode, setEditMode] = useState<boolean>(false);
    const [editIndex, setEditIndex] = useState<number>(-1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const debouncedSetNewPerson = useCallback(
        _debounce(async (person: any, propName: any) => {
            try {
                await validationNewPassSchema.validateAt(`${propName}`, { [propName]: person[propName].value });
            } catch (error) {
                person[propName].errorMessage = error.message;
            } finally {
                setNewPerson({ ...person });
            }
        }, 150),
        [],
    );

    const onChange = (e: any) => {
        const propName = e.target.id;
        const propValue = e.target.value;
        const newForm: any = newPerson;
        newForm[propName].value = propValue;
        newForm[propName].errorMessage = '';
        debouncedSetNewPerson(newForm, propName);
    };

    const onChangeTicket = (value: any) => {
        const newForm: any = newPerson;
        newForm.eventTicketId.value = value;
        newForm.eventTicketId.errorMessage = '';
        debouncedSetNewPerson(newForm, 'eventTicketId');
    };

    const toggleFormWithEditContent = (index: number) => {
        let defaultValueForForm = content[index];
        setNewPerson({ ...emptyPerson({ ...defaultValueForForm }) });
        setEditMode(true);
        setEditIndex(index);
        toggleShowForm();
    };

    const personFormBaseProps = { ...baseProps, required: false };

    useEffect(() => {
        dispatch(getEventTickets());
    }, [dispatch]);

    useMount(() => {
        if (task?.submission?.content && !content) {
            submit(task.submission.content.map((row: TaskRegisterDtoPerson) => ({ ...row })));
        }
    });

    const showTableLoading = passIsLoading || !passData.length;

    const disableRegister =
        !_isEmpty(
            newPerson.email.errorMessage ||
                newPerson.firstName.errorMessage ||
                newPerson.lastName.errorMessage ||
                newPerson.title.errorMessage ||
                newPerson.eventTicketId.errorMessage ||
                newPerson.companyName.errorMessage,
        ) ||
        _isEmpty(newPerson.email.value) ||
        _isEmpty(newPerson.firstName.value) ||
        _isEmpty(newPerson.lastName.value) ||
        _isEmpty(newPerson.title.value) ||
        _isEmpty(newPerson.eventTicketId.value) ||
        _isEmpty(newPerson.companyName.value);

    const registerUser = () => {
        const personToSubmit = {
            email: newPerson.email.value,
            firstName: newPerson.firstName.value,
            lastName: newPerson.lastName.value,
            title: newPerson.title.value,
            eventTicketId: newPerson.eventTicketId.value,
            companyName: newPerson.companyName.value,
        };
        if (isEmailDuplicated()) {
            const personWithError = { ...newPerson };
            personWithError.email.errorMessage = 'Duplicated Email';
            setNewPerson({ ...personWithError });
        } else {
            toggleShowForm();
            submitNewPerson(personToSubmit);
        }
    };

    const updateUser = () => {
        const personToSubmit = {
            email: newPerson.email.value,
            firstName: newPerson.firstName.value,
            lastName: newPerson.lastName.value,
            title: newPerson.title.value,
            eventTicketId: newPerson.eventTicketId.value,
            companyName: newPerson.companyName.value,
            isSelected: newPerson.isSelected,
        };
        if (isEmailDuplicated(editIndex)) {
            const personWithError = { ...newPerson };
            personWithError.email.errorMessage = 'Duplicated Email';
            setNewPerson({ ...personWithError });
        } else {
            toggleShowForm();
            onEditTicketPass(editIndex, personToSubmit);
            setEditMode(false);
            setEditIndex(-1);
        }
    };

    const isEmailDuplicated = (includeEditIndex: number = -1) =>
        content &&
        content
            .map((person, index) => {
                if (includeEditIndex === -1) {
                    return person.email;
                } else {
                    return includeEditIndex === index ? '-1' : person.email;
                }
            })
            .includes(newPerson.email.value);

    if (showTableLoading)
        return (
            <SpinnerWrapper>
                <Spinner color={themeContext.secondaryColor} />
            </SpinnerWrapper>
        );
    return (
        <NewPersonFormContainer>
            <div>{`Amount of Passes: ${calculateSelectedPasses(content)} of ${task.numPasses}`}</div>
            <NewPersonTable
                rows={content}
                onRowSelect={onRowSelect}
                numberOfPasses={task.numPasses}
                onDeletePerson={onDeletePerson}
                toggleFormWithEditContent={toggleFormWithEditContent}
            />

            {showForm ? (
                <>
                    <Container width="100%">
                        <Grid fluid>
                            <StyledRow width="100%" margin="0 -0.5rem">
                                <StyledCol {...colProps}>
                                    <Input
                                        id="firstName"
                                        name="firstName"
                                        label={'First name'}
                                        placeholder="First name"
                                        onChange={onChange}
                                        onBlur={onChange}
                                        errorMessage={newPerson.firstName.errorMessage}
                                        defaultValue={newPerson.firstName.value}
                                        tabIndex={1}
                                        {...personFormBaseProps}
                                    />
                                    <ErrorClearance hideClearance={newPerson.firstName.errorMessage} />
                                    <Input
                                        id="email"
                                        name="email"
                                        label={'Email'}
                                        placeholder="Email Address"
                                        onChange={onChange}
                                        onBlur={onChange}
                                        errorMessage={newPerson.email.errorMessage}
                                        defaultValue={newPerson.email.value}
                                        tabIndex={3}
                                        {...personFormBaseProps}
                                    />
                                    <ErrorClearance hideClearance={newPerson.email.errorMessage} />
                                    <DropdownWrapper>
                                        <Dropdown
                                            label={'Ticket Type'}
                                            onChange={onChangeTicket}
                                            options={formattedPassData}
                                            caretColor="purple"
                                            placeholder={
                                                formattedPassData.find(
                                                    (passData) => newPerson.eventTicketId.value === passData.value,
                                                )?.label || 'Select a Pass'
                                            }
                                            borderColor="#8692a6"
                                            errorMessage={newPerson.eventTicketId.errorMessage}
                                            tabIndex={5}
                                        />
                                    </DropdownWrapper>
                                    <ErrorClearance hideClearance={newPerson.eventTicketId.errorMessage} />
                                </StyledCol>
                                <StyledCol {...colProps}>
                                    <Input
                                        id="lastName"
                                        name="lastName"
                                        label={'Last name'}
                                        placeholder="Last name"
                                        onChange={onChange}
                                        onBlur={onChange}
                                        errorMessage={newPerson.lastName.errorMessage}
                                        defaultValue={newPerson.lastName.value}
                                        tabIndex={2}
                                        {...personFormBaseProps}
                                    />
                                    <ErrorClearance hideClearance={newPerson.lastName.errorMessage} />
                                    <Input
                                        id="title"
                                        name="title"
                                        label={'Title in the Company'}
                                        placeholder="Example: Product Lead"
                                        onChange={onChange}
                                        onBlur={onChange}
                                        errorMessage={newPerson.title.errorMessage}
                                        defaultValue={newPerson.title.value}
                                        tabIndex={4}
                                        {...personFormBaseProps}
                                    />
                                    <ErrorClearance hideClearance={newPerson.title.errorMessage} />
                                    <Input
                                        id="companyName"
                                        name="companyName"
                                        label={'Company Name'}
                                        placeholder="Connects.at, Inc"
                                        onChange={onChange}
                                        onBlur={onChange}
                                        errorMessage={newPerson.companyName.errorMessage}
                                        defaultValue={newPerson.companyName.value}
                                        tabIndex={6}
                                        {...personFormBaseProps}
                                    />
                                    <ErrorClearance hideClearance={newPerson.companyName.errorMessage} />
                                </StyledCol>
                            </StyledRow>
                        </Grid>
                    </Container>
                    <Container display="flex" justifyContent="center">
                        <StyledAddNewUser
                            disabled={disableRegister}
                            onClick={() => {
                                editMode ? updateUser() : registerUser();
                            }}>
                            {editMode ? 'Update' : 'Register'}
                        </StyledAddNewUser>
                    </Container>
                </>
            ) : (
                <Container display="flex" justifyContent="center">
                    <StyledAddNewUser
                        onClick={() => {
                            let defaultValueForForm = {};
                            if (task.type !== TaskType.clientPassSelectionTask) {
                                defaultValueForForm = { companyName: sponsor?.companyName || '' };
                            }
                            setNewPerson({ ...emptyPerson({ ...defaultValueForForm }) });
                            toggleShowForm();
                        }}>
                        Register new user
                    </StyledAddNewUser>
                </Container>
            )}
        </NewPersonFormContainer>
    );
};
export default NewPersonForm;
