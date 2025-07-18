import asyncio
from pyrogram import Client, filters
from apscheduler.schedulers.asyncio import AsyncIOScheduler

api_id = '24093433'
api_hash = '76fda89e815faa0998c66ebc10e8ad14'
session_name = 'ads'

source_channel = '@projectzopzadds'
target_chats = ['@ddoscm', '@ddoshome', '@KatanaC2', '@NanoComm', '@lkxstresschat']

client = Client(session_name, api_id=api_id, api_hash=api_hash)
scheduler = AsyncIOScheduler()

for_delete = {chat: [] for chat in target_chats}

@client.on_message(filters.command("id", prefixes="."))
async def chatid_handler(client, message):
    chat_id = message.chat.id
    await message.reply(f'The chat ID is {chat_id}')

@client.on_message(filters.regex(r'\.add\s+@(\w+)'))
async def add_chat_handler(client, message):
    global target_chats
    new_chat = message.matches[0].group(1)
    
    full_chat_id = '@' + new_chat

    if full_chat_id not in target_chats:
        target_chats.append(full_chat_id)
        for_delete[full_chat_id] = []
        await message.reply(f'Added {full_chat_id} to target chats.')
    else:
        await message.reply(f'Chat {full_chat_id} is already in the target chats.')

async def send_post():
    global for_delete
    async for message in client.get_chat_history(source_channel, limit=1):
        last_post = message
        if not last_post:
            return

        for chat in target_chats:
            try:
                if for_delete[chat]:
                    await client.delete_messages(chat, for_delete[chat])
                    print(f"Deleted {for_delete[chat]} message from {chat}")
                    for_delete[chat] = []
            except Exception as e:
                print(f"Error deleting {chat}: {e}")

        for chat in target_chats:
            try:
                res = await client.forward_messages_to_chat(chat, last_post.chat.id, last_post.id)
                for_delete[chat] = [res.id]
                print(f"Message {res.id} successfully forwarded to {chat}")
            except Exception as e:
                print(f"Error forwarding {chat}: {e}")

            await asyncio.sleep(3)

async def startup():
    await client.start_session()

async def main():
    await startup()
    print("Client started")

    scheduler.add_job(send_post, 'interval', hours=1)
    scheduler.start()
    
    await send_post()

    while True:
        await asyncio.sleep(3600)  # Sending ads every hour

if __name__ == '__main__':
    asyncio.run(main())
