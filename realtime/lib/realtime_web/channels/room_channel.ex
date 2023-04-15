defmodule RealtimeWeb.RoomChannel do
  use Phoenix.Channel

  #def join("room:lobby", message, socket) do
  #  {:ok, socket}
  #end

  #def join("room:test", message, socket) do
  #  {:ok, socket}
  #en

  def join("room:" <> _private_room_id, _params, socket) do
    {:ok, socket}
    #{:error, %{reason: "unauthorized"}}
  end

  def handle_in("new_msg", %{"body" => body, "token" => token, "image" => image}, socket) do
    #%{"exp" => 1679360462, "iat" => 1679359562, "jti" => "54393a70-003c-4f4f-9bab-d01a0b7f3ab4", "nbf" => 1679359562, "refresh" => false, "sub" => "2"}
    {:ok, claims} = RealtimeWeb.Token.verify_and_validate(token)
    sub = elem(Integer.parse(claims["sub"]), 0)
    location = hd tl String.splitter(socket.topic, ":") |> Enum.take(2)

    #RealtimeWeb.Endpoint.broadcast "room:lobby", "new_msg", %{body: body}
    broadcast!(socket, "new_msg", %{body: body, user_id: sub, location: location, files: image})
    {:noreply, socket}
  end

end
