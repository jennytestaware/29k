import {clone} from 'ramda';
import {renderHook} from '@testing-library/react-hooks';
import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import useUpdateProfileDetails from './useUpdateProfileDetails';

const authOriginalMock = clone(auth());

afterEach(() => {
  jest.clearAllMocks();
  // Reset to orignal mock (restoreAllMocks won't do it)
  jest.mocked(auth).mockReturnValue(clone(authOriginalMock));
});

describe('useUpdateProfileDetails', () => {
  it('creates an anonymous user if no existing user', async () => {
    auth().currentUser = null;

    const {result} = renderHook(() => useUpdateProfileDetails());

    await result.current({displayName: 'Some Display Name'});

    expect(auth().signInAnonymously).toHaveBeenCalledTimes(1);
  });

  it('updates the users displayName', async () => {
    const {result} = renderHook(() => useUpdateProfileDetails());

    await result.current({displayName: 'Some Display Name'});

    expect(auth().currentUser?.updateProfile).toHaveBeenCalledTimes(1);
    expect(auth().currentUser?.updateProfile).toHaveBeenCalledWith({
      displayName: 'Some Display Name',
    });

    expect(auth().currentUser?.updateEmail).toHaveBeenCalledTimes(0);
    expect(auth().currentUser?.updatePassword).toHaveBeenCalledTimes(0);
  });

  it('allows setting displayName to empty string', async () => {
    const {result} = renderHook(() => useUpdateProfileDetails());

    await result.current({displayName: ''});

    expect(auth().currentUser?.updateProfile).toHaveBeenCalledTimes(1);
    expect(auth().currentUser?.updateProfile).toHaveBeenCalledWith({
      displayName: '',
    });

    expect(auth().currentUser?.updateEmail).toHaveBeenCalledTimes(0);
    expect(auth().currentUser?.updatePassword).toHaveBeenCalledTimes(0);
  });

  it("only updates displayName if it's changed", async () => {
    (auth().currentUser as FirebaseAuthTypes.User).displayName =
      'Some Display Name';
    console.log('FOO', auth().currentUser);
    const {result} = renderHook(() => useUpdateProfileDetails());

    await result.current({displayName: 'Some Display Name'});

    expect(auth().currentUser?.updateProfile).toHaveBeenCalledTimes(0);
    expect(auth().currentUser?.updateEmail).toHaveBeenCalledTimes(0);
    expect(auth().currentUser?.updatePassword).toHaveBeenCalledTimes(0);
  });

  describe('isAnonymous = true', () => {
    beforeEach(() => {
      (auth().currentUser as FirebaseAuthTypes.User).isAnonymous = true;
    });

    it('requires both email and password to be set to upgrade to email account', async () => {
      const {result} = renderHook(() => useUpdateProfileDetails());

      await expect(
        async () => await result.current({email: 'some@email.address'}),
      ).rejects.toThrow('auth/password-missing');

      expect(auth().currentUser?.updateEmail).toHaveBeenCalledTimes(0);
      expect(auth().currentUser?.updateProfile).toHaveBeenCalledTimes(0);
    });
  });

  describe('isAnonymous = false', () => {
    beforeEach(() => {
      (auth().currentUser as FirebaseAuthTypes.User).isAnonymous = false;
    });

    it('updates the users email', async () => {
      const {result} = renderHook(() => useUpdateProfileDetails());

      await result.current({email: 'some@email.address'});

      expect(auth().currentUser?.updateEmail).toHaveBeenCalledTimes(1);
      expect(auth().currentUser?.updateEmail).toHaveBeenCalledWith(
        'some@email.address',
      );

      expect(auth().currentUser?.updateProfile).toHaveBeenCalledTimes(0);
      expect(auth().currentUser?.updatePassword).toHaveBeenCalledTimes(0);
    });

    it("only updates email if it's changed", async () => {
      (auth().currentUser as FirebaseAuthTypes.User).isAnonymous = false;
      (auth().currentUser as FirebaseAuthTypes.User).email =
        'some@email.address';

      const {result} = renderHook(() => useUpdateProfileDetails());

      await result.current({email: 'some@email.address'});

      expect(auth().currentUser?.updateProfile).toHaveBeenCalledTimes(0);
      expect(auth().currentUser?.updateEmail).toHaveBeenCalledTimes(0);
      expect(auth().currentUser?.updatePassword).toHaveBeenCalledTimes(0);
    });

    it('updates the users password', async () => {
      const {result} = renderHook(() => useUpdateProfileDetails());

      await result.current({password: 'somepassword'});

      expect(auth().currentUser?.updatePassword).toHaveBeenCalledTimes(1);
      expect(auth().currentUser?.updatePassword).toHaveBeenCalledWith(
        'somepassword',
      );

      expect(auth().currentUser?.updateEmail).toHaveBeenCalledTimes(0);
      expect(auth().currentUser?.updateProfile).toHaveBeenCalledTimes(0);
    });
  });
});
