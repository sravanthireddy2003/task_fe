import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";

import Textbox from "../components/Textbox";
import Button from "../components/Button";
import TenantSelector from "../components/TenantSelector";

import {
  authLogin,
  selectUser,
  selectAuthStatus,
  selectAuthError,
} from "../redux/slices/authSlice";

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
      // If backend requires 2FA, it may return a flag like { requires2fa: true }
      // or a message indicating OTP is required. Prefer tempToken if provided.
      const requires2fa = res?.requires2fa || res?.requires_2fa || false;
      const msg = (res?.message || "").toString().toLowerCase();
      const temp = res?.tempToken || res?.temp_token || null;
      const returnedUser = res?.user || res?.data?.user || null;
      const userHas2FA = !!(
        returnedUser &&
        (returnedUser.twoFactorEnabled || returnedUser.twoFaEnabled || returnedUser.is2faEnabled || returnedUser.twoFA)
      );
      const accessTokenPresent = !!(res?.accessToken || res?.token || res?.data?.accessToken || res?.data?.token);

      // If API explicitly requires 2FA, or message hints at OTP, or the returned user has 2FA and no access token was issued yet
      if (
        requires2fa ||
        msg.includes("otp") ||
        msg.includes("two-factor") ||
        msg.includes("2fa") ||
        (userHas2FA && !accessTokenPresent)
      ) {
        // navigate to verify page and pass tempToken or email so VerifyOTP can complete flow
        navigate('/verify-otp', { state: { tempToken: temp, email: data.email } });
        return;
      }

      // otherwise authLogin succeeded and user will be set in store; login effect will redirect
    } catch (err) {
      // authLogin rejected — UI already shows authError from slice
      // nothing to do here
    }
  };

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className='w-full min-h-screen flex items-center justify-center flex-col lg:flex-row bg-[#f3f4f6]'>
      <div className='w-full md:w-auto flex gap-0 md:gap-40 flex-col md:flex-row items-center justify-center'>

        {/* Left side */}
        <div className='h-full w-full lg:w-2/3 flex flex-col items-center justify-center'>
          <div className='w-full md:max-w-lg 2xl:max-w-3xl flex flex-col items-center justify-center gap-5 md:gap-y-10 2xl:-mt-20'>
            <span className='flex gap-1 py-1 px-3 border rounded-full text-sm md:text-base border-gray-300 text-gray-600'>
              Manage all your tasks in one place!
            </span>
            <p className='flex flex-col gap-0 md:gap-4 text-4xl md:text-6xl 2xl:text-7xl font-black text-center text-blue-700'>
              <span>Cloud-Based</span>
              <span>Task Manager</span>
            </p>
            <div className='cell'>
              <div className='circle rotate-in-up-left'></div>
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className='w-full md:w-1/3 p-4 md:p-1 flex flex-col justify-center items-center'>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className='form-container w-full md:w-[400px] flex flex-col gap-y-8 bg-white px-10 pt-14 pb-14'
          >
            <div className='mb-3'>
              <TenantSelector />
            </div>
            <div>
              <p className='text-blue-600 text-3xl font-bold text-center'>
                Welcome back!
              </p>
              <p className='text-center text-base text-gray-700'>
                Keep all your credentials safe.
              </p>
            </div>

            <div className='flex flex-col gap-y-5'>
              <Textbox
                placeholder='email@example.com'
                type='email'
                name='email'
                label='Email Address'
                className='w-full rounded-full'
                register={register("email", {
                  required: "Email Address is required!",
                })}
                error={errors.email?.message}
              />

              <Textbox
                placeholder='your password'
                type='password'
                name='password'
                label='Password'
                className='w-full rounded-full'
                register={register("password", {
                  required: "Password is required!",
                })}
                error={errors.password?.message}
              />


              {/* Show login error */}
              {authStatus === "failed" && authError && (
                <p className='text-sm text-red-500 text-center'>
                  {authError}
                </p>
              )}

              <Link
                to="/forgot"
                className='text-sm text-gray-500 hover:text-blue-600 hover:underline cursor-pointer text-center'
              >
                Forgot Password?
              </Link>

              <Button
                type='submit'
                label='Submit'
                className='w-full h-10 bg-blue-700 text-white rounded-full'
              />
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
