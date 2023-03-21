defmodule RealtimeWeb.RoomChannel do
  use Phoenix.Channel

  #def join("room:lobby", message, socket) do
  #  {:ok, socket}
  #end

  #def join("room:test", message, socket) do
  #  {:ok, socket}
  #end

  def join("room:" <> _private_room_id, _params, socket) do
    {:ok, socket}
    #{:error, %{reason: "unauthorized"}}
  end

  def handle_in("new_msg", %{"body" => body}, socket) do
    #push socket, socket.topic, %{body: body}
    #push socket, "new_msg", %{body: body}

    #RealtimeWeb.Endpoint.broadcast "room:lobby", "new_msg", %{body: body}
    broadcast!(socket, "new_msg", %{body: body})

    #broadcast! "room:lobby", "new_msg", %{body: body}
    #IO.puts(socket.topic)
    {:noreply, socket}
  end

end
