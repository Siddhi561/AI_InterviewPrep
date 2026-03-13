import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { removeUser } from "@/Store/user.Reducer";
import axiosInstance from "@/utils/axiosInstance"; // ✅ use axiosInstance

const Logout = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const logoutApi = async () => {
        const res = await axiosInstance.post('/user/logout'); // ✅ fixed endpoint
        return res.data;
    };

    const mutation = useMutation({
        mutationFn: logoutApi,
        onSuccess: () => {
            dispatch(removeUser());
            toast.success("Logged out successfully");
            navigate("/");
        },
        onError: () => {
            toast.error("Logout failed");
        },
    });

    return (
        <div onClick={() => mutation.mutate()} className="cursor-pointer">
            {mutation.isPending ? "Logging out..." : "Logout"}
        </div>
    );
};

export default Logout;
