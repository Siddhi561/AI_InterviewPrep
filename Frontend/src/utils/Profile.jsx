import { useQuery } from "@tanstack/react-query";
import { FaUserAlt } from "react-icons/fa";
import { IoLogOutOutline } from "react-icons/io5";
import { FaUser } from "react-icons/fa";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import Logout from "./Logout";
import UpdateProfile from "./UpdateProfile";
import axiosInstance from "@/utils/axiosInstance"; // ✅ use axiosInstance

const Profile = () => {
    const getProfile = async () => {
        const res = await axiosInstance.get('/user/me'); // ✅ fixed endpoint
        return res.data;
    };

    const { data, isLoading } = useQuery({
        queryKey: ["getProfile"],
        queryFn: getProfile,
    });

    return (
        <Popover className="cursor-pointer">
            <div>
                <PopoverTrigger className="cursor-pointer">
                    <div className="h-10 w-[20vw] overflow-hidden flex items-center justify-center gap-4">
                        <h1 className="text-2xl text-zinc-300 font-bold">
                            {data?.data?.user?.fullName} {/* ✅ fixed data path */}
                        </h1>
                        {data?.data?.user?.profilePhoto ? ( // ✅ fixed field name
                            <img
                                src={data?.data?.user?.profilePhoto}
                                className="h-10 w-10 rounded-[100vw]"
                                alt=""
                            />
                        ) : (
                            <FaUserAlt className="text-3xl text-zinc-300" />
                        )}
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[15vw]">
                    <div className="capitalize flex flex-col gap-3">
                        <div className="flex items-center justify-start gap-2 cursor-pointer">
                            <UpdateProfile />
                            <FaUser />
                        </div>
                        <div className="flex items-center justify-start gap-2 cursor-pointer">
                            <Logout />
                            <IoLogOutOutline />
                        </div>
                    </div>
                </PopoverContent>
            </div>
        </Popover>
    );
};

export default Profile;
