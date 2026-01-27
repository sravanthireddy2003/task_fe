import clsx from "clsx";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as Icons from "../icons";
import Title from "../components/Title";
import Button from "../components/Button";
import ConfirmatioDialog from "../components/Dialogs";
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
    } catch (error) {
      console.error("Failed to perform action:", error);
    }
  };

  const TableHeader = () => (
    <thead className='border-b border-gray-300'>
      <tr className='text-black  text-left'>
        <th className='py-2'>Client Name</th>
        <th className='py-2'>Email</th>
        <th className='py-2'>Phone</th>
        <th className='py-2'>Industry</th>
        <th className='py-2'>Deleted On</th>
      </tr>
    </thead>
  );

  const TableRow = ({ item }) => (
    <tr className='border-b border-gray-200 text-gray-600 hover:bg-gray-400/10'>
      <td className='py-2'>
        <div className='flex items-center gap-2'>
          <p className='w-full line-clamp-2 text-base text-black'>
            {item?.name || item?.company}
          </p>
        </div>
      </td>

      <td className='py-2'>
        {item?.email || "N/A"}
      </td>

      <td className='py-2'>
        {item?.phone || "N/A"}
      </td>

      <td className='py-2'>
        {item?.industry || "N/A"}
      </td>

      <td className='py-2 text-sm'>
        {item?.deletedAt ? new Date(item.deletedAt).toDateString() : "Unknown"}
      </td>

      <td className='py-2 flex gap-1 justify-end'>
        <Button
          icon={<Icons.RotateCcw className='text-xl text-gray-500' />}
          onClick={() => restoreClick(item.id || item._id)}
        />
        <Button
          icon={<Icons.Trash2 className='text-xl text-red-600' />}
          onClick={() => deleteClick(item.id || item._id)}
        />
      </td>
    </tr>
  );

  return (
    <>
      <div className='w-full md:px-1 px-0 mb-6'>
        <div className='flex items-center justify-between mb-8'>
          <Title title='Trashed Clients' />

          <div className='flex gap-2 md:gap-4 items-center'>
            <Button
              label='Restore All'
              icon={<Icons.RefreshCcw className='text-lg hidden md:flex' />}
              className='flex flex-row-reverse gap-1 items-center  text-black text-sm md:text-base rounded-md 2xl:py-2.5'
              onClick={() => restoreAllClick()}
              disabled={deletedClients.length === 0}
            />
            <Button
              label='Delete All'
              icon={<Icons.Trash2 className='text-lg hidden md:flex' />}
              className='flex flex-row-reverse gap-1 items-center  text-red-600 text-sm md:text-base rounded-md 2xl:py-2.5'
              onClick={() => deleteAllClick()}
              disabled={deletedClients.length === 0}
            />
          </div>
        </div>

        {status === 'loading' ? (
          <div className='text-center py-8'>Loading...</div>
        ) : (
          <div className='bg-white px-2 md:px-6 py-4 shadow-md rounded'>
            <div className='overflow-x-auto'>
              <table className='w-full mb-5'>
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
