class AddMessageBoardIdMessages < ActiveRecord::Migration[7.0]
  def change
      add_column :messages, :message_board_id, :integer
  end
end
