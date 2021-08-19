class CreateMessagesBoards < ActiveRecord::Migration[6.0]
  def change
    create_table :message_boards do |t|
      t.string :name
    end
  end
end
