import AiQuestions from "@/utils/AiQuestions";
import { useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axiosInstance from "@/utils/axiosInstance";
import { useNavigate } from "react-router-dom";

const SessionDetails = () => {
    const param = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const getSessionDetail = async () => {
        const res = await axiosInstance.get(`/session/${param.id}`); // ✅ fixed endpoint
        return res.data;
    };

    const { data, isLoading } = useQuery({
        queryKey: ["sessionDetail", param.id],
        queryFn: getSessionDetail,
    });

    const GenerateAiQuestionApi = async (payload) => {
        const res = await axiosInstance.post('/question/generate', payload); // ✅ fixed endpoint
        return res.data;
    };

    const mutation = useMutation({
        mutationFn: GenerateAiQuestionApi,
        onSuccess: () => {
            toast.success("AI Questions Generated");
            queryClient.invalidateQueries({ queryKey: ["sessionDetail", param.id] });
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Something went wrong");
        },
    });

    const AiQuestion = () => {
        const payload = {
            role: data?.data?.session?.role,
            experience: data?.data?.session?.experience, // ✅ already a number from backend
            topicToFocus: data?.data?.session?.topicToFocus, // ✅ fixed field name
            sessionId: param?.id,
        };

        mutation.mutate(payload);
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center h-[80vh]">
                <h1 className="text-2xl md:text-3xl font-semibold text-gray-300">Loading...</h1>
            </div>
        );
    }

    return (


        <div className="w-full flex flex-col items-center pt-10 px-4 md:px-10 gap-10 bg-gradient-to-b from-[#1a2540] via-[#24335a] to-[#1f2a4d] min-h-[88vh]">
            <div className="w-full md:w-[70%] lg:w-[60%]">
                <button
                    onClick={() => navigate('/session')}
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-all duration-300"
                >
                    ← Back to Sessions
                </button>
            </div>

            <div className="w-full md:w-[70%] lg:w-[60%] bg-gradient-to-br from-[#2b3a6b] to-[#1f2a4d] rounded-3xl shadow-2xl p-6 flex flex-col gap-6 text-white">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl md:text-2xl font-semibold text-cyan-400">Role:</h2>
                        <p className="text-lg md:text-xl font-medium">{data?.data?.session?.role}</p> {/* ✅ fixed data path */}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl md:text-2xl font-semibold text-cyan-400">Topic to Focus:</h2>
                        <p className="text-lg md:text-xl font-medium">{data?.data?.session?.topicToFocus}</p> {/* ✅ fixed field name */}
                    </div>
                    <div className="flex flex-col gap-1">
                        <h2 className="text-xl md:text-2xl font-semibold text-cyan-400">Experience:</h2>
                        <p className="text-lg md:text-xl font-medium">{data?.data?.session?.experience} years</p>
                    </div>
                </div>
            </div>

            <div className="w-full md:w-[70%] lg:w-[60%]">
                <AiQuestions />
            </div>

            <Button
                onClick={AiQuestion}
                disabled={mutation.isPending}
                className="bg-[#04317a] hover:bg-[#131d2c] mb-[5vw] text-white px-6 py-3 rounded-xl shadow-lg transition-all duration-300"
            >
                {mutation.isPending ? "Generating... Please wait ⏳" : "Generate AI Questions"}

            </Button>
        </div>
    );
};

export default SessionDetails;
