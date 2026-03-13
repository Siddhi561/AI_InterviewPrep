import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axiosInstance from "@/utils/axiosInstance"; // ✅ use axiosInstance

const CreateSessionButton = () => {
    const { register, handleSubmit, reset } = useForm();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);

    const createSessionApi = async (formdata) => {
        const res = await axiosInstance.post('/session/create', { // ✅ fixed endpoint
            ...formdata,
            experience: Number(formdata.experience), // ✅ convert to number
            topicToFocus: formdata.topicToFocus, // ✅ fixed field name
        });
        return res.data;
    };

    const mutation = useMutation({
        mutationFn: createSessionApi,
        onSuccess: () => {
            toast.success("Session Created");
            reset();
            setOpen(false);
            queryClient.invalidateQueries({ queryKey: ["session"] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Failed to create session");
        },
    });

    const SessionFormHandler = (formdata) => {
        mutation.mutate(formdata);
    };

    return (
        <Dialog>
            <DialogTrigger
                onClick={() => setOpen(true)}
                className="fixed bottom-8 right-8 p-3 px-6 font-bold text-white bg-zinc-900 rounded-full text-[19px] cursor-pointer z-50 shadow-lg hover:bg-zinc-700 transition-all"
            >
                + Create Session
            </DialogTrigger>
            <DialogContent className="w-[90%] sm:w-[500px] rounded-2xl p-8">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold mb-4">
                        Enter the details for your session
                    </DialogTitle>
                    <form onSubmit={handleSubmit(SessionFormHandler)} className="flex flex-col gap-5">
                        <input
                            type="text"
                            {...register("role")}
                            placeholder="Enter your role"
                            className="outline-none border-b border-gray-300 w-full py-2 px-2 focus:border-blue-500 transition-all"
                        />
                        <input
                            type="number"
                            {...register("experience")}
                            placeholder="Enter your experience (years)"
                            className="outline-none border-b border-gray-300 w-full py-2 px-2 focus:border-blue-500 transition-all"
                        />
                        <input
                            type="text"
                            {...register("topicToFocus")}
                            placeholder="Enter topics to focus"
                            className="outline-none border-b border-gray-300 w-full py-2 px-2 focus:border-blue-500 transition-all"
                        />
                        <button
                            type="submit"
                            className="px-4 py-2 bg-zinc-900 text-white rounded-xl w-full mt-2"
                            disabled={mutation.isPending}
                        >
                            {mutation.isPending ? "Creating..." : "Create Session"}
                        </button>
                    </form>
                    <DialogDescription className="text-xs text-gray-400 mt-2">
                        Please provide form details carefully
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
};

export default CreateSessionButton;
