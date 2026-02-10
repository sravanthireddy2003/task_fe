import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "sonner";
import taskManagerLogo from "../assets/task1.png";
import * as Icons from "../icons";
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

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm();

  // Load saved credentials on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("loginEmail");
    const savedPassword = localStorage.getItem("loginPassword");
    const savedRemember = localStorage.getItem("rememberMe") === "true";

    if (savedEmail) {
      setValue("email", savedEmail);
      setRememberMe(savedRemember);
    }
    if (savedPassword && savedRemember) {
      setValue("password", savedPassword);
    }
  }, [setValue]);

  const onSubmit = async (data) => {
    try {
      // Save if remember me checked
      if (rememberMe) {
        localStorage.setItem("loginEmail", data.email);
        localStorage.setItem("loginPassword", data.password);
        localStorage.setItem("rememberMe", "true");
      } else {
        localStorage.removeItem("loginPassword");
        localStorage.setItem("rememberMe", "false");
      }

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

  // Show auth errors as toast
  useEffect(() => {
    if (authStatus === "failed" && authError) {
      toast.error(authError);
    }
  }, [authStatus, authError]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* LEFT – LOGIN FORM */}
          <div className="p-12 md:p-14">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Welcome back
              </h1>
              <p className="text-gray-600 text-lg">
                Sign in to continue to Task Manager Pro
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-1">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email address
                </label>
                <Textbox
                  type="email"
                  name="email"
                  placeholder="korapatishwini@gmail.com"
                  register={register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address",
                    },
                  })}
                  error={errors.email?.message}
                  className="h-14 text-base rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <Link
                    to="/forgot"
                    className="text-sm text-blue-600 font-medium hover:text-blue-800 hover:underline transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
                <Textbox
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  register={register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                  error={errors.password?.message}
                  showPassword={showPassword}
                  onPasswordToggle={() => setShowPassword(!showPassword)}
                  rightIcon={showPassword ? (
                    <Icons.EyeOff className="h-5 w-5" />
                  ) : (
                    <Icons.Eye className="h-5 w-5" />
                  )}
                  className="h-14 text-base rounded-xl"
                />
              </div>

              <div className="flex items-center space-x-3">
                <div className="relative">
                  <input
                    type="checkbox"
                    id="remember"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-all cursor-pointer"
                  />
                </div>
                <label
                  htmlFor="remember"
                  className="text-gray-700 cursor-pointer select-none hover:text-gray-900 transition-colors"
                >
                  Remember me
                </label>
              </div>

              {authStatus === "failed" && authError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <p className="text-red-700 text-sm font-medium">
                    {authError}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                label={authStatus === "loading" ? "Signing in..." : "Sign in"}
                disabled={authStatus === "loading"}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
              />
            </form>
          </div>

          {/* RIGHT – ILLUSTRATION & INFO */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-12 md:p-14 flex flex-col items-center justify-center">
            <div className="mb-10">
              <img
                src={taskManagerLogo}
                alt="Task management illustration"
                className="w-full max-w-md mb-10 drop-shadow-lg"
              />
            </div>

            <div className="text-center max-w-md">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Secure & organized workflow
              </h3>
              <p className="text-gray-700 leading-relaxed">
                Manage tasks efficiently with role-based access, OTP verification,
                and real-time tracking — all in one place.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;