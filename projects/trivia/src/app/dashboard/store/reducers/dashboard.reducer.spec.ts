import { TEST_DATA } from '../../../testing/test.data';
import { subscriptionSaveStatus, getTotalSubscriptionStatus, blogs, scoreBoard, systemStat } from './dashboard.reducer';
import { DashboardActions, DashboardActionTypes } from '../actions';
import { Subscription, Subscribers, Blog } from 'shared-library/shared/model';
import { Subscriber } from 'rxjs';

describe('Reducer: subscriptionSaveStatus', () => {
    const _testReducer = subscriptionSaveStatus;

    it('Initial State', () => {
        const state: String = _testReducer(undefined, { type: null, payload: null });

        expect(state).toEqual('NONE');
    });

    it('Add Subscription Actions', () => {
        const state: String = _testReducer(null, {
            type: DashboardActionTypes.ADD_SUBSCRIBER,
            payload: { subscription: { 'email': 'test@test.com' } }
        });
        expect(state).toEqual('IN PROCESS');

        const newState: String = _testReducer('SUCCESS', { type: DashboardActionTypes.ADD_SUBSCRIBER_SUCCESS, payload: null });
        expect(newState).toEqual('SUCCESS');

        const errorState: String = _testReducer('Error while saving Subscription',
            { type: DashboardActionTypes.ADD_SUBSCRIBER_ERROR, payload: 'Error while saving Subscription' });
        expect(errorState).toEqual('Error while saving Subscription');
    });

    it('Any other action', () => {
        const state: String = _testReducer('SUCCESS', { type: DashboardActionTypes.TOTAL_SUBSCRIBER_SUCCESS, payload: null });
        expect(state).toEqual('SUCCESS');
    });

});
describe('Reducer: getTotalSubscriptionStatus', () => {
    const _testReducer = getTotalSubscriptionStatus;

    it('Initial State', () => {
        const state: Subscribers = _testReducer(undefined, { type: null, payload: null });

        expect(state).toEqual(<Subscribers>[]);
    });

    it('Total Subscriber Actions', () => {

        const subscriber: Subscribers = { count: 3 };
        const newState: Subscribers = _testReducer(<Subscribers>[], {
            type: DashboardActionTypes.TOTAL_SUBSCRIBER_SUCCESS,
            payload: subscriber
        });
        expect(newState).toEqual(subscriber);

    });

    it('Any other action', () => {
        const state: Subscribers = _testReducer(<Subscribers>[], { type: DashboardActionTypes.ADD_SUBSCRIBER_SUCCESS, payload: null });
        expect(state).toEqual(<Subscribers>[]);
    });

});

describe('Reducer: blogs', () => {
    const _testReducer = blogs;

    it('Initial State', () => {
        const state: Blog[] = _testReducer(undefined, { type: null, payload: [] });
        expect(state).toEqual(null);
    });

    it('Total Blogs Actions', () => {

        const blog: Blog[] = TEST_DATA.blog;
        const newState: Blog[] = _testReducer(<Blog[]>[], {
            type: DashboardActionTypes.LOAD_BLOGS_SUCCESS,
            payload: blog
        });
        expect(newState).toEqual(blog);

        const errorState: String = _testReducer('Error while getting Blogs',
            { type: DashboardActionTypes.LOAD_BLOGS_ERROR, payload: 'Error while getting Blogs' });
        expect(errorState).toEqual('Error while getting Blogs');

    });

    it('Any other action', () => {
        const state: Subscribers = _testReducer(<Subscribers>[], { type: DashboardActionTypes.ADD_SUBSCRIBER_SUCCESS, payload: null });
        expect(state).toEqual(<Subscribers>[]);
    });

});

describe('Reducer: scoreBoard', () => {
    const _testReducer = scoreBoard;

    it('Initial State', () => {
        const state: any = _testReducer(undefined, { type: null, payload: null });

        expect(state).toEqual(null);
    });

    it('Total Subscriber Actions', () => {

        const data = [];
        data[0] = { '1': [{ 'score': 123, userId: '9K3sL9eHEZYXFZ68oRrW7a6wUmV2' }] };
        const newState: any = _testReducer(null, {
            type: DashboardActionTypes.LOAD_LEADERBOARD_SUCCESS,
            payload: data
        });
        expect(newState).toEqual(data);

    });

    it('Any other action', () => {
        const state: any = _testReducer(null, { type: DashboardActionTypes.LOAD_SYSTEM_STAT_SUCCESS, payload: null });
        expect(state).toEqual(null);
    });

});

describe('Reducer: systemStat', () => {
    const _testReducer = systemStat;

    it('Initial State', () => {
        const state: any = _testReducer(undefined, { type: null, payload: null });

        expect(state).toEqual(null);
    });

    it('Total Subscriber Actions', () => {

        const data = TEST_DATA.realTimeStats;

        const newState: any = _testReducer(null, {
            type: DashboardActionTypes.LOAD_SYSTEM_STAT_SUCCESS,
            payload: data
        });
        expect(newState).toEqual(data);

        const errorState: String = _testReducer('Error while getting RealTime Stats Information',
            { type: DashboardActionTypes.LOAD_SYSTEM_STAT_ERROR, payload: 'Error while getting RealTime Stats Information' });
        expect(errorState).toEqual('Error while getting RealTime Stats Information');

    });

    it('Any other action', () => {
        const state: any = _testReducer(null, { type: DashboardActionTypes.LOAD_LEADERBOARD_SUCCESS, payload: null });
        expect(state).toEqual(null);
    });

});

