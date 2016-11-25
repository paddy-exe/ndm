/*global require*/
import angular from 'angular';
const moduleName = 'npm-ui.left-bar'
  , electron = require('electron')
  , {remote} = electron
  , {Menu, MenuItem} = remote;

angular.module(moduleName, [])
  .controller('LeftBarController', /*@ngInject*/ function LeftBarController($rootScope, $scope, $window, $log, npm, npmGlobal, errorsService, loadingFactory, notificationFactory) {

    const unregisterLeftbarEditProject = $rootScope.$on('left-bar:edit-project', (eventInfo, data) => {
        $scope.$apply(() => {
          this.editorFilePath = data.dirName;
        });
      })
      , unregisterLeftBarSelectedProjectNpmInstall = $rootScope.$on('left-bar:selected-project-npm-install', (eventInformation, data) => {
        let folder = data.path.path
          , projectName = data.path.dirName
          , deleteProjectName = item => {

            $scope.$apply(() => {
              delete this.npmInstallingProjects[item];
            });
          };

        $scope.$apply(() => {
          this.npmInstallingProjects[projectName] = true;
        });

        npm.npmInFolder(folder).catch(error => {
          deleteProjectName(projectName);
          $log.error(`Configuring npm for $ npm install,  in ${folder}...`, error);
          errorsService.handleError('Error', `Error configuring npm for install in folder ${folder}: ${error}`);
        }).then(npmInFolder => {
          npmInFolder.launchInstall().then(() => {
            $log.info(`Finished npm install in project ${folder}`);
            notificationFactory.notify(`Finished $ npm install in project ${projectName}`);
            deleteProjectName(projectName);
        }).catch(err => {
          deleteProjectName(projectName);
          $log.error(err);
          errorsService.showErrorBox('Error', `Error running $ npm install in folder ${folder}: ${err}`);
        });
      });
    })
    , unregisterLeftBarSelectedProjectNpmPrune = $rootScope.$on('left-bar:selected-project-npm-prune', (eventInformation, data) => {
      let folder = data.path.path
        , projectName = data.path.dirName
        , deleteProjectName = item => {
          $scope.$apply(() => {
            delete this.npmPruningProjects[item];
          });
        };

      $scope.$apply(() => {
        this.npmPruningProjects[projectName] = true;
      });

      npm.npmInFolder(folder).catch(error => {
        deleteProjectName(projectName);
        $log.error(`Configuring npm for $ npm prune,  in ${folder}...`, error);
        errorsService.handleError('Error', `Error configuring npm for prune in folder ${folder}: ${error}`);
      }).then(npmInFolder => {
        npmInFolder.prune().then(() => {
          $log.info(`Finished npm prune in project ${folder}`);
          notificationFactory.notify(`Finished $ npm prune in project ${projectName}`);
          deleteProjectName(projectName);
        }).catch(err => {
          deleteProjectName(projectName);
          $log.error(err);
          errorsService.showErrorBox('Error', `Error running $ npm prune in folder ${folder}: ${err}`);
        });
      });
    })
    , unregisterLeftBarSelectedProjectNpmDedupe = $rootScope.$on('left-bar:selected-project-npm-dedupe', (eventInformation, data) => {
      let folder = data.path.path
        , projectName = data.path.dirName
        , deleteProjectName = item => {
          $scope.$apply(() => {
            delete this.npmDedupingProjects[item];
          });
        };

      $scope.$apply(() => {
        this.npmDedupingProjects[projectName] = true;
      });

      npm.npmInFolder(folder).catch(error => {
        deleteProjectName(projectName);
        $log.error(`Configuring npm for $ npm dedupe,  in ${folder}...`, error);
        errorsService.handleError('Error', `Error configuring npm for dedupe in folder ${folder}: ${error}`);
      }).then(npmInFolder => {
        npmInFolder.dedupe().then(() => {
          $log.info(`Finished npm dedupe in project folder ${folder}`);
          notificationFactory.notify(`Finished $ npm dedupe in project ${projectName}`);
          deleteProjectName(projectName);
        }).catch(err => {
          $log.error(err);
          errorsService.showErrorBox('Error', `Error running $ npm dedupe in folder ${folder}: ${err}`);
          deleteProjectName(projectName);
        });
      });
    });

    this.selectGlobal = () => {

      this.selectedProject = npmGlobal;
      this.global = true;
      $rootScope.$emit('left-bar:select-project', {
        'path': this.selectedProject
      });
    };

    this.rightClickMenu = item => {

      let projectsContextMenu = new Menu()
        , selectedProject = this.selectedProject;

      projectsContextMenu.append(new MenuItem({
        'label': 'Npm Install',
        click() {
          $rootScope.$emit('left-bar:selected-project-npm-install', {
            'path': item
          });
        }
      }));

      projectsContextMenu.append(new MenuItem({
        'label': 'Prune',
        click() {
          $rootScope.$emit('left-bar:selected-project-npm-prune', {
            'path': item
          });
        }
      }));

      projectsContextMenu.append(new MenuItem({
        'label': 'Dedupe',
        click() {
          $rootScope.$emit('left-bar:selected-project-npm-dedupe', {
            'path': item
          });
        }
      }));

      projectsContextMenu.append(new MenuItem({'type': 'separator'}));
      projectsContextMenu.append(new MenuItem({'label': 'Edit',
        click() {

        $rootScope.$emit('left-bar:edit-project', {
          'dirName': `${item.path}/package.json`
        });
      }}));

      projectsContextMenu.append(new MenuItem({'label': 'Remove',
        click() {

        $scope.$evalAsync(() => {
          this.removedProject = item;
          if (item === selectedProject) {

            delete this.selectedProject;
            $rootScope.$emit('left-bar:delete-selected-project');
          }
        });

        $rootScope.$emit('left-bar:delete-project', {
          'dirName': item.dirName
        });
      }}));

      projectsContextMenu.popup(remote.getCurrentWindow());
    };

    this.selectProject = (item, event) => {
      if (item) {

        this.global = false;
        this.selectedProject = item;
        $rootScope.$emit('left-bar:select-project', {
          'path': this.selectedProject.path
        });
      }
      event.stopPropagation();//prevent folder deletion
    };

    this.deleteProject = (item, event) => {

      loadingFactory.finished();

      if (item) {
        if (item === this.selectedProject) {

          delete this.selectedProject;
          $rootScope.$emit('left-bar:delete-selected-project');
        }
        $rootScope.$emit('left-bar:delete-project', {
          'dirName': item.dirName
        });
      }

      event.stopPropagation();//prevent project selection
    };

    this.npmInstallingProjects = [];
    this.npmPruningProjects = [];
    this.npmDedupingProjects = [];

    $scope.$on('$destroy', () => {

      unregisterLeftBarSelectedProjectNpmInstall();
      unregisterLeftBarSelectedProjectNpmPrune();
      unregisterLeftBarSelectedProjectNpmDedupe();
      unregisterLeftbarEditProject();
    });
  });

export default moduleName;