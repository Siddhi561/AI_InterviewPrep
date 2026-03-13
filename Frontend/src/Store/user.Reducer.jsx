import { createSlice } from "@reduxjs/toolkit"
const initialState = {
    isAuthenticated: false,
    user: null
}

const userSlice = createSlice({
    name: "user",
    initialState,
    reducers: {
        addUser: (state, action) => {
            state.isAuthenticated = true;
            state.user = action.payload;
        },
        removeUser: (state, action) => {
            state.isAuthenticated = false;
            state.user = null;
        }
    }
})

export default userSlice.reducer;
export const { addUser, removeUser } = userSlice.actions