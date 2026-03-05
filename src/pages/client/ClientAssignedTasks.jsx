import React from "react";
import { useSelector } from "react-redux";
import TaskCard from "../../components/TaskCard";

const resolveClientId = (user) => {
  const resourcesId = user?.resources?.mappedClient;
  const metricsId = user?.metrics?.mappedClient;
  const fallback = user?.clientId || user?.client_id;
  return resourcesId ?? metricsId ?? fallback;
};

const ClientAssignedTasks = () => {
  const user = useSelector((state) => state.auth.user);
  const { tasks = [] } = useSelector((state) => state.tasks || {});
  const clientId = resolveClientId(user);

  const clientTasks = tasks.filter((task) => {
    const ids = [task?.clientId, task?.client_id, task?.client];
    return ids.some((id) => id && clientId && id.toString() === clientId.toString());
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-500">Assigned Tasks</p>
        <h1 className="text-3xl font-semibold text-gray-900">Your active work</h1>
        <p className="text-sm text-gray-500 max-w-3xl">
          These tasks are mapped to the client profile that arrived with your login token.
        </p>
      </div>

      {clientTasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-6 text-sm text-gray-500">
          No tasks are currently assigned to you.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clientTasks.map((task, index) => (
            <TaskCard key={task.id || task._id || index} task={task} />
          ))}
        </div>
      )}
    </section>
  );
};

export default ClientAssignedTasks;
