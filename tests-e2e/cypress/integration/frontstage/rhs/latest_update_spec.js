// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

// ***************************************************************
// - [#] indicates a test step (e.g. # Go to a page)
// - [*] indicates an assertion (e.g. * Check the title)
// ***************************************************************

import users from '../../../fixtures/users.json';

describe('playbook run rhs > latest update', () => {
    const playbookName = 'Playbook (' + Date.now() + ')';
    const defaultReminderMessage = '# Default reminder message';
    let teamId;
    let userId;
    let playbookId;

    before(() => {
        // # Turn off growth onboarding screens
        cy.apiLogin(users.sysadmin);
        cy.apiUpdateConfig({
            ServiceSettings: {EnableOnboardingFlow: false},
        });

        // # Login as user-1
        cy.legacyApiLogin('user-1');

        cy.legacyApiGetTeamByName('ad-1').then((team) => {
            teamId = team.id;
            cy.legacyApiGetCurrentUser().then((user) => {
                userId = user.id;
                cy.legacyApiGetChannelByName('ad-1', 'town-square').then(({channel}) => {
                    // # Create a playbook
                    cy.apiCreateTestPlaybook({
                        teamId,
                        title: playbookName,
                        userId,
                        broadcastChannelId: channel.id,
                        reminderTimerDefaultSeconds: 3600,
                        reminderMessageTemplate: defaultReminderMessage,
                    }).then((playbook) => {
                        playbookId = playbook.id;
                    });
                });
            });
        });
    });

    beforeEach(() => {
        // # Size the viewport to show the RHS without covering posts.
        cy.viewport('macbook-13');

        // # Login as user-1
        cy.legacyApiLogin('user-1');

        // # Create a new playbook run
        const now = Date.now();
        const name = 'Playbook Run (' + now + ')';
        const channelName = 'playbook-run-' + now;
        cy.apiRunPlaybook({
            teamId,
            playbookId,
            playbookRunName: name,
            ownerUserId: userId,
        });

        // # Navigate directly to the application and the playbook run channel
        cy.visit('/ad-1/channels/' + channelName);
    });

    describe('status update interactive dialog', () => {
        it('shows an error when entering an update message with whitespace', () => {
            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // # Type the invalid data
                cy.findByTestId('messageinput').clear().type(' {enter} {enter}  ');

                // # Submit the dialog.
                cy.get('#interactiveDialogSubmit').click();

                // * Verify the error is provided.
                cy.findByTestId('messagehelp-text').should('exist')
                    .contains('This field is required.');

                // # Enter valid data
                cy.findByTestId('messageinput').type('valid update');

                // # Submit the dialog.
                cy.get('#interactiveDialogSubmit').click();
            });

            // * Verify that the interactive dialog has gone.
            cy.get('#interactiveDialogModal').should('not.exist');
        });
    });

    describe('shows the last update in update message', () => {
        it('shows the default when we have not made an update before', () => {
            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the first message is there.
                cy.findByTestId('messageinput').within(() => {
                    cy.findByText(defaultReminderMessage).should('exist');
                });
            });
        });
        it('when we have made a previous update', () => {
            const now = Date.now();
            const firstMessage = 'Update - ' + now;

            // # Create a first status update
            cy.updateStatus(firstMessage);

            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the first message is there.
                cy.findByTestId('messageinput').within(() => {
                    cy.findByText(firstMessage).should('exist');
                });
            });
        });
    });

    describe('the default reminder', () => {
        it('shows the configured default when we have not made a previous update', () => {
            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the default is as expected
                cy.findAllByTestId('autoCompleteSelector').eq(0).within(() => {
                    cy.get('input').should('have.value', '60min');
                });
            });
        });

        it('shows the last reminder we typed in: None', () => {
            const now = Date.now();
            const firstMessage = 'Update - ' + now;

            // # Create a first status update
            cy.updateStatus(firstMessage, 'none');

            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the default is as expected
                cy.findAllByTestId('autoCompleteSelector').eq(0).within(() => {
                    cy.get('input').should('have.value', 'None');
                });
            });
        });

        it('shows the last reminder we typed in: 15min', () => {
            const now = Date.now();
            const firstMessage = 'Update - ' + now;

            // # Create a first status update
            cy.updateStatus(firstMessage, '15');

            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the default is as expected
                cy.findAllByTestId('autoCompleteSelector').eq(0).within(() => {
                    cy.get('input').should('have.value', '15min');
                });
            });
        });

        it('shows the last reminder we typed in: 30min', () => {
            const now = Date.now();
            const firstMessage = 'Update - ' + now;

            // # Create a first status update
            cy.updateStatus(firstMessage, '30');

            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the default is as expected
                cy.findAllByTestId('autoCompleteSelector').eq(0).within(() => {
                    cy.get('input').should('have.value', '30min');
                });
            });
        });

        it('shows the last reminder we typed in: 60min', () => {
            const now = Date.now();
            const firstMessage = 'Update - ' + now;

            // # Create a first status update
            cy.updateStatus(firstMessage, '60');

            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the default is as expected
                cy.findAllByTestId('autoCompleteSelector').eq(0).within(() => {
                    cy.get('input').should('have.value', '60min');
                });
            });
        });

        it('shows the last reminder we typed in: 4hr', () => {
            const now = Date.now();
            const firstMessage = 'Update - ' + now;

            // # Create a first status update
            cy.updateStatus(firstMessage, '4');

            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the default is as expected
                cy.findAllByTestId('autoCompleteSelector').eq(0).within(() => {
                    cy.get('input').should('have.value', '4hr');
                });
            });
        });

        it('shows the last reminder we typed in: 24hr', () => {
            const now = Date.now();
            const firstMessage = 'Update - ' + now;

            // # Create a first status update
            cy.updateStatus(firstMessage, '24');

            // # Run the `/playbook update` slash command.
            cy.executeSlashCommand('/playbook update');

            // # Get the interactive dialog modal.
            cy.get('#interactiveDialogModal').within(() => {
                // * Verify the default is as expected
                cy.findAllByTestId('autoCompleteSelector').eq(0).within(() => {
                    cy.get('input').should('have.value', '24hr');
                });
            });
        });
    });
});
