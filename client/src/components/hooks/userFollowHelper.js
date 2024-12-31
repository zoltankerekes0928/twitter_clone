import { useMutation, useQueryClient } from "@tanstack/react-query";

const userFollow = () => {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const queryClient = useQueryClient();

  const {
    mutate: userFollowMutation,
    isPending,
    // eslint-disable-next-line react-hooks/rules-of-hooks
  } = useMutation({
    mutationFn: async (id) => {
      const respone = await fetch(`/api/users/follow/${id}`, {
        method: "POST",
      });
      const data = await respone.json();

      if (!respone.ok) {
        throw new Error(data.error);
      }
    },
    onError: (error) => {
      console.log(error);
      throw new Error(error)
    },
    onSuccess: () => {
      Promise.all([
        queryClient.invalidateQueries({ queryKey: ["suggedtedUser"] }),
        queryClient.invalidateQueries({ queryKey: ["authUser"] }),
      ]);
    },
  });

  return { userFollowMutation, isPending };
};

export default userFollow;
