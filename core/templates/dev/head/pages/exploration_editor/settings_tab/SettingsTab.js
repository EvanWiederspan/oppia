// Copyright 2014 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Controllers for the exploration settings tab.
 */

oppia.controller('SettingsTab', [
  '$scope', '$http', '$window', '$modal',
  '$rootScope', 'ExplorationDataService',
  'explorationTitleService', 'explorationCategoryService',
  'explorationObjectiveService', 'explorationLanguageCodeService',
  'explorationTagsService', 'ExplorationRightsService',
  'explorationInitStateNameService', 'explorationParamSpecsService',
  'changeListService', 'AlertsService', 'explorationStatesService',
  'explorationParamChangesService', 'ExplorationWarningsService',
  'ExplorationAdvancedFeaturesService', 'ALL_CATEGORIES',
  'EXPLORATION_TITLE_INPUT_FOCUS_LABEL', 'UserEmailPreferencesService',
  'EditableExplorationBackendApiService', 'UrlInterpolationService',
  'explorationAutomaticTextToSpeechService',
  function(
      $scope, $http, $window, $modal,
      $rootScope, ExplorationDataService,
      explorationTitleService, explorationCategoryService,
      explorationObjectiveService, explorationLanguageCodeService,
      explorationTagsService, ExplorationRightsService,
      explorationInitStateNameService, explorationParamSpecsService,
      changeListService, AlertsService, explorationStatesService,
      explorationParamChangesService, ExplorationWarningsService,
      ExplorationAdvancedFeaturesService, ALL_CATEGORIES,
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL, UserEmailPreferencesService,
      EditableExplorationBackendApiService, UrlInterpolationService,
      explorationAutomaticTextToSpeechService) {
    $scope.EXPLORATION_TITLE_INPUT_FOCUS_LABEL = (
      EXPLORATION_TITLE_INPUT_FOCUS_LABEL);

    $scope.CATEGORY_LIST_FOR_SELECT2 = [];
    for (var i = 0; i < ALL_CATEGORIES.length; i++) {
      $scope.CATEGORY_LIST_FOR_SELECT2.push({
        id: ALL_CATEGORIES[i],
        text: ALL_CATEGORIES[i]
      });
    }

    $scope.isRolesFormOpen = false;

    $scope.TAG_REGEX = GLOBALS.TAG_REGEX;

    var CREATOR_DASHBOARD_PAGE_URL = '/creator_dashboard';
    var EXPLORE_PAGE_PREFIX = '/explore/';

    $scope.getExplorePageUrl = function() {
      return (
        window.location.protocol + '//' + window.location.host +
        EXPLORE_PAGE_PREFIX + $scope.explorationId);
    };

    $scope.initSettingsTab = function() {
      $scope.explorationTitleService = explorationTitleService;
      $scope.explorationCategoryService = explorationCategoryService;
      $scope.explorationObjectiveService = explorationObjectiveService;
      $scope.explorationLanguageCodeService = explorationLanguageCodeService;
      $scope.explorationTagsService = explorationTagsService;
      $scope.ExplorationRightsService = ExplorationRightsService;
      $scope.explorationInitStateNameService = explorationInitStateNameService;
      $scope.explorationParamSpecsService = explorationParamSpecsService;
      $scope.explorationParamChangesService = explorationParamChangesService;
      $scope.UserEmailPreferencesService = UserEmailPreferencesService;

      ExplorationDataService.getData().then(function() {
        $scope.refreshSettingsTab();
        $scope.hasPageLoaded = true;
      });
    };

    $scope.refreshSettingsTab = function() {
      // Ensure that explorationStatesService has been initialized before
      // getting the state names from it. (Otherwise, navigating to the
      // settings tab directly (by entering a URL that ends with /settings)
      // results in a console error.
      if (explorationStatesService.isInitialized()) {
        var categoryIsInSelect2 = $scope.CATEGORY_LIST_FOR_SELECT2.some(
          function(categoryItem) {
            return categoryItem.id === explorationCategoryService.savedMemento;
          }
        );

        // If the current category is not in the dropdown, add it
        // as the first option.
        if (!categoryIsInSelect2 &&
            explorationCategoryService.savedMemento) {
          $scope.CATEGORY_LIST_FOR_SELECT2.unshift({
            id: explorationCategoryService.savedMemento,
            text: explorationCategoryService.savedMemento
          });
        }

        $scope.stateNames = explorationStatesService.getStateNames();
      }
    };

    $scope.$on('refreshSettingsTab', $scope.refreshSettingsTab);

    $scope.initSettingsTab();

    $scope.ROLES = [{
      name: 'Manager (can edit permissions)',
      value: 'owner'
    }, {
      name: 'Collaborator (can make changes)',
      value: 'editor'
    }, {
      name: 'Playtester (can give feedback)',
      value: 'viewer'
    }];

    $scope.saveExplorationTitle = function() {
      explorationTitleService.saveDisplayedValue();
    };

    $scope.saveExplorationCategory = function() {
      explorationCategoryService.saveDisplayedValue();
    };

    $scope.saveExplorationObjective = function() {
      explorationObjectiveService.saveDisplayedValue();
    };

    $scope.saveExplorationLanguageCode = function() {
      explorationLanguageCodeService.saveDisplayedValue();
    };

    $scope.saveExplorationTags = function() {
      explorationTagsService.saveDisplayedValue();
    };

    $scope.saveExplorationInitStateName = function() {
      var newInitStateName = explorationInitStateNameService.displayed;

      if (!explorationStatesService.getState(newInitStateName)) {
        AlertsService.addWarning(
          'Invalid initial state name: ' + newInitStateName);
        explorationInitStateNameService.restoreFromMemento();
        return;
      }

      explorationInitStateNameService.saveDisplayedValue();

      $rootScope.$broadcast('refreshGraph');
    };

    $scope.postSaveParamChangesHook = function() {
      ExplorationWarningsService.updateWarnings();
    };

    /********************************************
    * Methods for enabling advanced features.
    ********************************************/
    $scope.areParametersEnabled = (
      ExplorationAdvancedFeaturesService.areParametersEnabled);
    $scope.enableParameters = (
      ExplorationAdvancedFeaturesService.enableParameters);

    $scope.isAutomaticTextToSpeechEnabled = (
      explorationAutomaticTextToSpeechService.isAutomaticTextToSpeechEnabled);
    $scope.toggleAutomaticTextToSpeech = (
      explorationAutomaticTextToSpeechService.toggleAutomaticTextToSpeech);

    /********************************************
    * Methods for rights management.
    ********************************************/
    $scope.openEditRolesForm = function() {
      $scope.isRolesFormOpen = true;
      $scope.newMemberUsername = '';
      $scope.newMemberRole = $scope.ROLES[0];
    };

    $scope.closeEditRolesForm = function() {
      $scope.newMemberUsername = '';
      $scope.newMemberRole = $scope.ROLES[0];
      $scope.closeRolesForm();
    };

    $scope.editRole = function(newMemberUsername, newMemberRole) {
      $scope.closeRolesForm();
      ExplorationRightsService.saveRoleChanges(
        newMemberUsername, newMemberRole);
    };

    $scope.toggleViewabilityIfPrivate = function() {
      ExplorationRightsService.setViewability(
        !ExplorationRightsService.viewableIfPrivate());
    };

    /********************************************
    * Methods for notifications muting.
    ********************************************/

    $scope.muteFeedbackNotifications = function() {
      UserEmailPreferencesService.setFeedbackNotificationPreferences(true);
    };
    $scope.muteSuggestionNotifications = function() {
      UserEmailPreferencesService.setSuggestionNotificationPreferences(true);
    };

    $scope.unmuteFeedbackNotifications = function() {
      UserEmailPreferencesService.setFeedbackNotificationPreferences(false);
    };
    $scope.unmuteSuggestionNotifications = function() {
      UserEmailPreferencesService.setSuggestionNotificationPreferences(false);
    };

    /********************************************
    * Methods relating to control buttons.
    ********************************************/
    $scope.previewSummaryTile = function() {
      AlertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/settings_tab/' +
          'preview_summary_tile_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.getExplorationTitle = function() {
              return explorationTitleService.displayed;
            };
            $scope.getExplorationObjective = function() {
              return explorationObjectiveService.displayed;
            };
            $scope.getExplorationCategory = function() {
              return explorationCategoryService.displayed;
            };
            $scope.getThumbnailIconUrl = function() {
              var category = explorationCategoryService.displayed;
              if (constants.ALL_CATEGORIES.indexOf(category) === -1) {
                category = constants.DEFAULT_CATEGORY_ICON;
              }
              return '/subjects/' + category + '.svg';
            };
            $scope.getThumbnailBgColor = function() {
              var category = explorationCategoryService.displayed;
              if (!constants.CATEGORIES_TO_COLORS.hasOwnProperty(category)) {
                var color = constants.DEFAULT_COLOR;
              } else {
                var color = constants.CATEGORIES_TO_COLORS[category];
              }
              return color;
            };

            $scope.close = function() {
              $modalInstance.dismiss();
              AlertsService.clearWarnings();
            };
          }
        ]
      });
    };

    $scope.showTransferExplorationOwnershipModal = function() {
      AlertsService.clearWarnings();
      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/settings_tab/' +
          'transfer_exploration_ownership_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.transfer = $modalInstance.close;

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        ExplorationRightsService.makeCommunityOwned();
      });
    };

    $scope.deleteExploration = function() {
      AlertsService.clearWarnings();

      $modal.open({
        templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
          '/pages/exploration_editor/settings_tab/' +
          'delete_exploration_modal_directive.html'),
        backdrop: true,
        controller: [
          '$scope', '$modalInstance', function($scope, $modalInstance) {
            $scope.reallyDelete = $modalInstance.close;

            $scope.cancel = function() {
              $modalInstance.dismiss('cancel');
              AlertsService.clearWarnings();
            };
          }
        ]
      }).result.then(function() {
        EditableExplorationBackendApiService.deleteExploration(
          $scope.explorationId).then(function() {
            $window.location = CREATOR_DASHBOARD_PAGE_URL;
          });
      });
    };

    var openModalForModeratorAction = function(action) {
      AlertsService.clearWarnings();

      var moderatorEmailDraftUrl = '/moderatorhandler/email_draft/' + action;

      $http.get(moderatorEmailDraftUrl).then(function(response) {
        // If the draft email body is empty, email functionality will not be
        // exposed to the mdoerator.
        var draftEmailBody = response.data.draft_email_body;

        $modal.open({
          templateUrl: UrlInterpolationService.getDirectiveTemplateUrl(
            '/pages/exploration_editor/settings_tab/' +
            'take_moderator_action_modal_directive.html'),
          backdrop: true,
          resolve: {
            draftEmailBody: function() {
              return draftEmailBody;
            }
          },
          controller: [
            '$scope', '$modalInstance', 'draftEmailBody',
            function($scope, $modalInstance, draftEmailBody) {
              $scope.action = action;
              $scope.willEmailBeSent = Boolean(draftEmailBody);
              $scope.emailBody = draftEmailBody;

              if ($scope.willEmailBeSent) {
                $scope.EMAIL_BODY_SCHEMA = {
                  type: 'unicode',
                  ui_config: {
                    rows: 20
                  }
                };
              }

              $scope.reallyTakeAction = function() {
                $modalInstance.close({
                  emailBody: $scope.emailBody
                });
              };

              $scope.cancel = function() {
                $modalInstance.dismiss('cancel');
                AlertsService.clearWarnings();
              };
            }
          ]
        }).result.then(function(result) {
          ExplorationRightsService.saveModeratorChangeToBackend(
            action, result.emailBody);
        });
      });
    };

    $scope.unpublishExplorationAsModerator = function() {
      openModalForModeratorAction('unpublish_exploration');
    };

    $scope.isExplorationLockedForEditing = function() {
      return changeListService.isExplorationLockedForEditing();
    };

    $scope.closeRolesForm = function() {
      $scope.isRolesFormOpen = false;
    };
  }
]);
