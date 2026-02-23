import { auth, db } from "../core/firebase.js";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  updateProfile 
} from "firebase/auth";
import { ref, set, onValue } from "firebase/database";

export const authService = {

  async signUp(email, password, displayName) {
    if (!email || !password || !displayName) {
      throw new Error("Please fill in all fields.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);

      await updateProfile(userCredential.user, { displayName });

      await set(ref(db, 'users/' + userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: displayName
      });

      return userCredential.user;

    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        throw new Error("This email is already in use.");
      } else {
        throw error;
      }
    }
  },

  async signIn(email, password) {
    if (!email || !password) {
      throw new Error("Please enter email and password.");
    }
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      throw error;
    }
  },

  signOut() {
    return auth.signOut();
  },

  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  },

  subscribeToUsers(callback) {
    const usersRef = ref(db, 'users');
    return onValue(usersRef, snapshot => {
      const users = snapshot.val();
      const usersArray = users ? Object.values(users) : [];
      callback(usersArray);
    });
  }

};