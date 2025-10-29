import { createSlice } from '@reduxjs/toolkit'

export interface ProfileState {
  accountName: string
}

const initialState: ProfileState = {
  accountName: ''
}

export const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    setProfileAccountName: (state, action) => {
      state.accountName = action.payload
    }
  },
  selectors: {
    selectProfileAccountName: (state) => state.accountName
  }
})

export const { setProfileAccountName } = profileSlice.actions

export const { selectProfileAccountName } = profileSlice.selectors
