import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const useProfileUpdate = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: editProfileMutation, isPending: profileEditing } =
    useMutation({
      mutationFn: async (fromData) => {
        const response = await fetch("/api/users/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fromData),
        });
        const data = response.json();

        if (!response.ok) {
          throw new Error(data);
        }
        return data;
      },
      onError: (error) => {
        toast.error(error);
      },
      onSuccess: () => {
        Promise.all([
          queryClient.invalidateQueries({ queryKey: ["authUser"] }),
          queryClient.invalidateQueries({ queryKey: ["userProfile"] }),
        ]);
        toast.success("Profile Updated");
      },
    });

  return { editProfileMutation, profileEditing };
};

export default useProfileUpdate;
