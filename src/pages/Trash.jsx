import clsx from "clsx";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Icons from "../icons";
import Button from "../components/Button";
import ConfirmatioDialog from "../components/Dialogs";
import PageHeader from "../components/PageHeader";
import {
  fetchDeletedClients,
  restoreClient,
  permanentDeleteClient,
  selectDeletedClients,
  selectClientStatus
} from "../redux/slices/clientSlice";

const Trash = () => {
  const dispatch = useDispatch();
  const [openDialog, setOpenDialog] = useState(false);
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState(null);
  const [type, setType] = useState("delete");
  const [selected, setSelected] = useState("");

  const deletedClients = useSelector(selectDeletedClients);
  const status = useSelector(selectClientStatus);

  useEffect(() => {
    dispatch(fetchDeletedClients());
  }, [dispatch]);

  const deleteAllClick = () => {
    setType("deleteAll");
    setMsg("Do you want to permanently delete all clients?");
    setOpenDialog(true);
  };

  const restoreAllClick = () => {
    setType("restoreAll");
    setMsg("Do you want to restore all clients in the trash?");
    setOpenDialog(true);
  };

  const deleteClick = (id) => {
    setType("delete");
    setSelected(id);
    setMsg("Do you want to permanently delete this client?");
    setOpenDialog(true);
  };

  const restoreClick = (id) => {
    setSelected(id);
    setType("restore");
    setMsg("Do you want to restore this client?");
    setOpenDialog(true);
  };

  const deleteRestoreHandler = async () => {
    try {
      if (type === "delete") {
        await dispatch(permanentDeleteClient(selected)).unwrap();
      } else if (type === "restore") {
        await dispatch(restoreClient(selected)).unwrap();
      } else if (type === "deleteAll") {
        // Delete all deleted clients
        for (const client of deletedClients) {
          await dispatch(permanentDeleteClient(client.id || client._id)).unwrap();
        }
      } else if (type === "restoreAll") {
        // Restore all deleted clients
        for (const client of deletedClients) {
          await dispatch(restoreClient(client.id || client._id)).unwrap();
        }
      }
      // Refresh the list
      dispatch(fetchDeletedClients());
    } catch (error) { }
  };

  const TableHeader = () => (
    <thead>
      <tr>
        <th>Client Name</th>
        <th>Email</th>
        <th>Phone</th>
        <th>Industry</th>
        <th>Deleted On</th>
        <th className="text-right">Actions</th>
      </tr>
    </thead>
  );

  const TableRow = ({ item }) => (
    <tr className="cursor-pointer">
      <td>
        <div className='flex items-center gap-2'>
          <p className='w-full line-clamp-2 text-[14px] font-semibold text-gray-900'>
            {item?.name || item?.company}
          </p>
        </div>
      </td>

      <td>
        <span className="text-[14px] text-gray-700">{item?.email || "N/A"}</span>
      </td>

      <td>
        <span className="text-[14px] text-gray-700">{item?.phone || "N/A"}</span>
      </td>

      <td>
        <span className="text-[14px] text-gray-700">{item?.industry || "N/A"}</span>
      </td>

      <td>
        <span className="text-[14px] text-gray-600">{item?.deletedAt ? new Date(item.deletedAt).toDateString() : "Unknown"}</span>
      </td>

      <td className='text-right'>
        <div className="flex justify-end gap-1">
          <Button
            icon={<Icons.RotateCcw className='text-xl text-gray-500 hover:text-blue-600 transition-colors' />}
            onClick={() => restoreClick(item.id || item._id)}
            className="p-1.5 hover:bg-blue-50 rounded"
          />
          <Button
            icon={<Icons.Trash2 className='text-xl text-red-600 hover:text-red-700 transition-colors' />}
            onClick={() => deleteClick(item.id || item._id)}
            className="p-1.5 hover:bg-red-50 rounded"
          />
        </div>
      </td>
    </tr>
  );

  return (
    <>
      <div className='w-full md:px-1 px-0 mb-6'>
        <PageHeader
          title="Trashed Clients"
          subtitle="Restore or permanently delete clients removed from the system"
          onRefresh={() => dispatch(fetchDeletedClients())}
          refreshing={status === 'loading'}
        >
          <div className='flex gap-2 md:gap-4 items-center'>
            <Button
              label='Restore All'
              icon={<Icons.RefreshCcw className='text-lg hidden md:flex' />}
              className='btn btn-secondary flex flex-row-reverse gap-1 items-center'
              onClick={() => restoreAllClick()}
              disabled={deletedClients.length === 0}
            />
            <Button
              label='Delete All'
              icon={<Icons.Trash2 className='text-lg hidden md:flex' />}
              className='btn bg-red-50 hover:bg-red-100 text-red-600 flex flex-row-reverse gap-1 items-center'
              onClick={() => deleteAllClick()}
              disabled={deletedClients.length === 0}
            />
          </div>
        </PageHeader>

        {status === 'loading' ? (
          <div className='text-center py-8'>Loading...</div>
        ) : (
          <div className="tm-list-container">
            <div className='overflow-x-auto'>
              <table className='tm-table'>
                <TableHeader />
                <tbody>
                  {deletedClients?.map((client, id) => (
                    <TableRow key={id} item={client} />
                  ))}
                </tbody>
              </table>
              {deletedClients.length === 0 && (
                <div className='text-center py-8 text-gray-500'>
                  No deleted clients found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* <AddUser open={open} setOpen={setOpen} /> */}

      <ConfirmatioDialog
        open={openDialog}
        setOpen={setOpenDialog}
        msg={msg}
        setMsg={setMsg}
        type={type}
        setType={setType}
        onClick={() => deleteRestoreHandler()}
      />
    </>
  );
};

export default Trash;
