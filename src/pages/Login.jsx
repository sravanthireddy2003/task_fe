import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import Textbox from "../components/Textbox";
import Button from "../components/Button";

import {
  authLogin,
  selectUser,
  selectAuthStatus,
  selectAuthError,
} from "../redux/slices/authSlice";
import { getDefaultLandingPath } from "../utils";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector(selectUser);
  const authStatus = useSelector(selectAuthStatus);
  const authError = useSelector(selectAuthError);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      const res = await dispatch(authLogin(data)).unwrap();

      const requires2fa = res?.requires2fa || res?.requires_2fa || false;
      const msg = (res?.message || "").toString().toLowerCase();
      const temp = res?.tempToken || res?.temp_token || null;
      const returnedUser = res?.user || res?.data?.user || null;
      const userHas2FA =
        returnedUser &&
        (returnedUser.twoFactorEnabled ||
          returnedUser.twoFaEnabled ||
          returnedUser.is2faEnabled ||
          returnedUser.twoFA);

      const accessTokenPresent = !!(
        res?.accessToken ||
        res?.token ||
        res?.data?.accessToken ||
        res?.data?.token
      );

      if (
        requires2fa ||
        msg.includes("otp") ||
        msg.includes("two-factor") ||
        msg.includes("2fa") ||
        (userHas2FA && !accessTokenPresent)
      ) {
        navigate("/verify-otp", {
          state: { tempToken: temp, email: data.email },
        });
        return;
      }
    } catch (err) { }
  };

  useEffect(() => {
    if (user) {
      const target = getDefaultLandingPath(user);
      navigate(target, { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="w-full min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-5xl flex flex-col lg:flex-row justify-center items-center gap-12">

        {/* Left Section */}
        <div className="w-full lg:w-1/2 flex flex-col items-center text-center gap-6">
          <span className="py-2 px-5 border rounded-full text-gray-600 text-sm border-gray-300 bg-white shadow-sm">
            Manage all your tasks in one place!
          </span>

          <h1 className="text-gray-900 font-extrabold text-5xl md:text-6xl leading-tight">
            Cloud-Based <br /> Task Manager
          </h1>

          <p className="text-gray-600 max-w-md">
            Streamline your workflow, track progress, and manage tasks efficiently.
          </p>

          <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mt-4">
            <div className="w-16 h-16 bg-gray-400 rounded-full"></div>
          </div>
        </div>

        {/* Right Section – Login Form */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="w-full max-w-md bg-white shadow-lg rounded-xl p-10 flex flex-col gap-6 border border-gray-200"
          >
            <h2 className="text-3xl font-bold text-gray-900 text-center">
              Welcome back!
            </h2>
            <p className="text-center text-gray-600 mb-4">
              Keep all your credentials safe.
            </p>

            <Textbox
              placeholder="email@example.com"
              type="email"
              name="email"
              label="Email Address"
              className="w-full rounded-lg"
              register={register("email", {
                required: "Email Address is required!",
              })}
              error={errors.email?.message}
            />

            <Textbox
              placeholder="Your password"
              type="password"
              name="password"
              label="Password"
              className="w-full rounded-lg"
              register={register("password", {
                required: "Password is required!",
              })}
              error={errors.password?.message}
            />

            {authStatus === "failed" && authError && (
              <p className="text-sm text-error-500 text-center bg-error-50 p-2 rounded-lg border border-error-200">{authError}</p>
            )}

            <Link
              to="/forgot"
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline text-center mb-2"
            >
              Forgot Password?
            </Link>

            <Button
              type="submit"
              label={authStatus === "loading" ? "Signing in..." : "Sign In"}
              className="w-full h-12 bg-gray-900 text-white rounded-lg flex justify-center items-center font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={authStatus === "loading"}
            />

            <p className="text-center text-gray-600 text-sm mt-2">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary-600 font-semibold hover:text-primary-700 hover:underline"
              >
                Sign up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
