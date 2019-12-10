import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Model, Document } from "mongoose";
import { UserI } from "../../user/user.model";

function localAuthenticate(User: Model<Document>, email: string, password: string, done: Function) {

  User.findOne({ email: email }).exec()
    .then((user: UserI) => {

      if (!user) return done(null, false, { message: "Could not find user" });
      // if (!user.verified) //NOTE: not yet implemented
      //   return done(null, false, {
      //     message: "Email not yet verified"
      //   });

      user.authenticate(password, (authError, authenticated) => {

        if (authError) return done(authError);
        if (!authenticated) return done(null, false, { message: "This password is not correct." });

        return done(null, user);

      });

    })
    .catch((err: Error) => done(err));

}

export function setup(User: Model<Document>) {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, function (email, password, done) {

    return localAuthenticate(User, email, password, done);

  }));
}