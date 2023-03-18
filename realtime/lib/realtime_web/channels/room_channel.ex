defmodule RealtimeWeb.RoomChannel do
  use Phoenix.Channel

  def join("room:lobby", message, socket) do
    {:ok, socket}
  end

  def join("room:" <> _private_room_id, _params, socket) do
    {:error, %{reason: "unauthorized"}}
  end


  def handle_in("new_msg", %{"body" => body}, socket) do
    broadcast!(socket, "new_msg", %{body: body})
    {:noreply, socket}
  end

end
