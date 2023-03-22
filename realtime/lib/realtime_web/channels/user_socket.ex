defmodule RealtimeWeb.UserSocket do
  use Phoenix.Socket

  use RealtimeWeb.Token

  # A Socket handler
  #
  # It's possible to control the websocket connection and
  # assign values that can be accessed by your channel topics.

  ## Channels
  # Uncomment the following line to define a "room:*" topic
  # pointing to the `RealtimeWeb.RoomChannel`:
  #
  channel "room:*", RealtimeWeb.RoomChannel

  channel "notification:*", RealtimeWeb.NotificationChannel

  channel "private:*", RealtimeWeb.PrivateChannel
  #
  # To create a channel file, use the mix task:
  #
  #     mix phx.gen.channel Room
  #
  # See the [`Channels guide`](https://hexdocs.pm/phoenix/channels.html)
  # for further details.


  # Socket params are passed from the client and can
  # be used to verify and authenticate a user. After
  # verification, you can put default assigns into
  # the socket that will be set for all channels, ie
  #
  #     {:ok, assign(socket, :user_id, verified_user_id)}
  #
  # To deny connection, return `:error` or `{:error, term}`. To control the
  # response the client receives in that case, [define an error handler in the
  # websocket
  # configuration](https://hexdocs.pm/phoenix/Phoenix.Endpoint.html#socket/3-websocket-configuration).
  #
  # See `Phoenix.Token` documentation for examples in
  # performing token verification on connect.
  @impl true
  def connect(%{"token" => token}, socket, _connect_info) do
    #signer = Joken.Signer.create("HS256", "secret")

    #{:ok, token, claims} = RealtimeWeb.Token.generate_and_sign(%{}, signer)
    #IO.puts(token)
    #IO.puts(claims)

    #{:ok, claims} = RealtimeWeb.Token.verify_and_validate(token)

    #IO.puts(claims["refresh"])
    #if claims["refresh"] != false do
    #  IO.puts("error")
    #  :error
    #end
    #IO.puts(claims["refresh"] == false)
    case RealtimeWeb.Token.verify_and_validate(token) do
      {:ok, claims} -> case claims["refresh"] do
        false -> {:ok, socket}
        _ -> :error
      end
      _ -> :error
    end
    #try do
    #  {:ok, claims} = RealtimeWeb.Token.verify_and_validate(token)
    #  {:ok, socket}
    #raise
    #  :error
    #end

    #IO.puts(claims)

    #if token != "apple" do
    #  :error
    #else
    #  {:ok, socket}
    #end
  end

  # Socket id's are topics that allow you to identify all sockets for a given user:
  #
  #     def id(socket), do: "user_socket:#{socket.assigns.user_id}"
  #
  # Would allow you to broadcast a "disconnect" event and terminate
  # all active sockets and channels for a given user:
  #
  #     Elixir.RealtimeWeb.Endpoint.broadcast("user_socket:#{user.id}", "disconnect", %{})
  #
  # Returning `nil` makes this socket anonymous.
  @impl true
  def id(_socket), do: nil
end
