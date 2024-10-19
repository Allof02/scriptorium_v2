import * as Yup from 'yup';

export const userSignupSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required').max(50),
  lastName: Yup.string().required('Last name is required').max(50),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string().required('Password is required').min(6, 'Password must be at least 6 characters'),
  avatar: Yup.string().url('Avatar must be a valid URL').nullable(),
  phoneNumber: Yup.string().nullable(),
  role: Yup.string().oneOf(['ADMIN', 'USER'], 'Invalid role').default('USER'),
});

export const userUpdateSchema = Yup.object().shape({
  firstName: Yup.string().max(50),
  lastName: Yup.string().max(50),
  //email: Yup.string().email('Invalid email'),
  avatar: Yup.string().url('Avatar must be a valid URL').nullable(),
  phoneNumber: Yup.string().nullable(),
});