import { storeFactory } from './util';
import { handleCheckLoggedIn, handleLogout } from '../actions/login';
import moxios from 'moxios';

describe('login actions dispatchers', () => {
    beforeEach(() => {
        moxios.install();
    });

    afterEach(() => {
        moxios.uninstall();
    });

    test('updates state correctly on login', async () => {
        const store = storeFactory();
        const expectedState = {
            login: {
                isLoggedIn: true,
                username: 'foobar',
                name: 'Foo Bar'
            },
            cycles: {
                cycles: []
            }
        };

        moxios.wait(() => {
            const request = moxios.requests.mostRecent();
            request.respondWith({
                status: 200,
                response: {
                    username: expectedState.login.username,
                    name: expectedState.login.name
                }
            });
        });

        await store.dispatch(handleCheckLoggedIn());
        const newState = store.getState();
        expect(newState).toEqual(expectedState);
    });

    test('updates state correctly on logout', async () => {
        const store = storeFactory();
        const expectedState = {
            login: {
                isLoggedIn: false
            },
            cycles: {
                cycles: []
            }
        };

        moxios.wait(() => {
            const request = moxios.requests.mostRecent();
            request.respondWith({
                status: 200
            });
        });

        await store.dispatch(handleLogout());
        const newState = store.getState();
        expect(newState).toEqual(expectedState);
    });
});
