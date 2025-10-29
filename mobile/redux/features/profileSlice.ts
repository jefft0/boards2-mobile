import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { makeCallTx } from "./linkingSlice";
import { RootState, ThunkExtra } from "redux/redux-provider";

const CLIENT_NAME_PARAM = 'client_name=boards2';

export interface ProfileState {
  accountName: string;
}

const initialState: ProfileState = {
  accountName: "",
};

export const profileSlice = createSlice({
  name: "profile",
  initialState,
  reducers: {
    setProfileAccountName: (state, action) => {
      state.accountName = action.payload;
    }
  },
  selectors: {
    selectProfileAccountName: (state) => state.accountName,
  },
});

export const { setProfileAccountName } = profileSlice.actions;

export const { selectProfileAccountName } = profileSlice.selectors;
