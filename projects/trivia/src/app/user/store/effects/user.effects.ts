import { Injectable } from '@angular/core';
import { Effect, Actions, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { switchMap, map, filter, take, mergeMap } from 'rxjs/operators';
import { empty } from 'rxjs';

import { UserService, QuestionService, GameService } from '../../../../../../shared-library/src/lib/core/services';
import { Question, RouterStateUrl, Friends, Game, Invitation } from '../../../../../../shared-library/src/lib/shared/model';
import { UserActionTypes } from '../actions';
import * as userActions from '../actions/user.actions';
import { AppState } from '../../../store';
import { UserActions, coreState } from '../../../../../../shared-library/src/lib/core/store';


@Injectable()
export class UserEffects {
    // Save user profile
    @Effect()
    addUser$ = this.actions$
        .pipe(ofType(UserActionTypes.ADD_USER_PROFILE))
        .pipe(
            switchMap((action: userActions.AddUserProfile) => {
                return this.userService.saveUserProfile(action.payload.user).pipe(
                    map((status: any) => new userActions.AddUserProfileSuccess())
                )
            })
        );

    // Load User Published Question by userId from router
    @Effect()
    loadUserPublishedRouteQuestions$ = this.actions$
        .pipe(ofType('ROUTER_NAVIGATION'))
        .pipe(
            map((action: any): RouterStateUrl => action.payload.routerState),
            filter((routerState: RouterStateUrl) =>
                routerState.url.toLowerCase().startsWith('/my/questions')),
            mergeMap((routerState: RouterStateUrl) =>
                this.store.select(coreState).pipe(
                    map(s => s.user),
                    filter(u => !!u),
                    take(1),
                    map(user => user.userId))
            ))
        .pipe(
            switchMap((id: string) => {
                return this.questionService.getUserQuestions(id, true).pipe(map((questions: Question[]) =>
                    new userActions.LoadUserPublishedQuestionsSuccess(questions)
                ));
            })
        );

    // Load User UnPublished Question by userId from router
    @Effect()
    loadUserUnpublishedQuestions$ = this.actions$
        .pipe(ofType('ROUTER_NAVIGATION'))
        .pipe(
            map((action: any): RouterStateUrl => action.payload.routerState),
            filter((routerState: RouterStateUrl) =>
                routerState.url.toLowerCase().startsWith('/my/questions')),
            mergeMap((routerState: RouterStateUrl) =>
                this.store.select(coreState).pipe(
                    map(s => s.user),
                    filter(u => !!u),
                    take(1),
                    map(user => user.userId))
            ))
        .pipe(
            switchMap((id: string) => {
                return this.questionService.getUserQuestions(id, false).pipe(map((questions: Question[]) =>
                    new userActions.LoadUserUnpublishedQuestionsSuccess(questions)
                ));
            })
        );


    // Add Question
    @Effect()
    addQuestion$ = this.actions$
        .pipe(ofType(UserActionTypes.ADD_QUESTION))
        .pipe(
            switchMap((action: userActions.AddQuestion) => {
                this.questionService.saveQuestion(action.payload.question);
                return empty();
            })
        );

    // Save user profile
    @Effect()
    saveInvitation$ = this.actions$
        .pipe(ofType(UserActionTypes.ADD_USER_INVITATION))
        .pipe(
            switchMap((action: userActions.AddUserInvitation) =>
                this.userService.saveUserInvitations(action.payload).pipe(
                    map((statusMessages: any) => new userActions.AddUserInvitationSuccess(statusMessages['messages']))
                )
            )
        );

    // Make friend
    @Effect()
    makeFriend$ = this.actions$
        .pipe(ofType(UserActionTypes.MAKE_FRIEND))
        .pipe(
            switchMap((action: userActions.MakeFriend) =>
                this.userService.checkInvitationToken(action.payload).pipe(
                    map((friend: any) => this.userAction.storeInvitationToken('NONE'))
                ).pipe(map(() => new userActions.MakeFriendSuccess()))
            ));

    // Get Game list
    @Effect()
    getGameResult$ = this.actions$
        .pipe(ofType(UserActionTypes.GET_GAME_RESULT))
        .pipe(
            switchMap((action: userActions.GetGameResult) =>
                this.gameService.getGameResult(action.payload)
                    .pipe(map((games: Game[]) => new userActions.GetGameResultSuccess(games)))
            )
        );

    // Load Friend Invitations
    @Effect()
    loadFriendInvitations$ = this.actions$
        .pipe(ofType('ROUTER_NAVIGATION'))
        .pipe(
            map((action: any): RouterStateUrl => action.payload.routerState),
            filter((routerState: RouterStateUrl) =>
                routerState.url.toLowerCase().startsWith('/dashboard')),
            mergeMap((routerState: RouterStateUrl) =>
                this.store.select(coreState).pipe(
                    map(s => s.user),
                    filter(u => !!u),
                    take(1),
                    map(user => user.email))
            ))
        .pipe(
            switchMap((email: string) => {
                return this.userService.loadFriendInvitations(email).pipe(map((invitations: Invitation[]) =>
                    new userActions.LoadUserInvitationsSuccess(invitations)
                ));
            })
        );

    // Update Invitation
    @Effect()
    UpdateInvitation$ = this.actions$
        .pipe(ofType(UserActionTypes.UPDATE_INVITATION))
        .pipe(
            switchMap((action: userActions.UpdateInvitation) => {
                this.userService.setInvitation(action.payload);
                return empty();
            }
            )
        );


    constructor(
        private actions$: Actions,
        private userService: UserService,
        private questionService: QuestionService,
        private userAction: UserActions,
        private gameService: GameService,
        private store: Store<AppState>,
    ) {

    }
}
