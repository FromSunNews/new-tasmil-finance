-- Thread view with messages
create or replace view thread_view as
with message_data as (
    select
        thread_id,
        jsonb_array_elements(values -> 'messages') as msg
    from thread
    where values is not NULL
),

filtered_messages as (
    select
        thread_id,
        msg ->> 'type' as msg_type,
        case
            when msg ->> 'type' = 'human' then msg ->> 'content'
            when
                msg ->> 'type' = 'ai'
                and (msg -> 'tool_calls' is NULL or msg -> 'tool_calls' = '[]')
                and (msg ->> 'content' is not NULL and msg ->> 'content' != '')
                then msg ->> 'content'
        end as message_content
    from message_data
    where
        (msg ->> 'type' = 'human')
        or (
            msg ->> 'type' = 'ai' and (msg -> 'tool_calls' is NULL or msg -> 'tool_calls' = '[]')
            and (msg ->> 'content' is not NULL and msg ->> 'content' != '')
        )
),

messages_agg as (
    select
        thread_id,
        array_agg(
            message_content
            order by msg_num
        ) as messages
    from (select
        thread_id,
        row_number() over (
            partition by thread_id
            order by msg_num
        ) as msg_num,
        message_content
    from (select
        fm.thread_id,
        row_number() over () as msg_num,
        fm.message_content
    from filtered_messages as fm
    where fm.message_content is not NULL) as numbered_messages) as ordered_messages
    group by thread_id
),

human_messages_agg as (
    select
        thread_id,
        array_agg(
            message_content
            order by msg_num
        ) as human_messages
    from (select
        thread_id,
        row_number() over (
            partition by thread_id
            order by msg_num
        ) as msg_num,
        message_content
    from (
        select
            fm.thread_id,
            row_number() over () as msg_num,
            fm.message_content
        from filtered_messages as fm
        where
            fm.message_content is not NULL
            and fm.msg_type = 'human'
    ) as numbered_human_messages) as ordered_human_messages
    group by thread_id
),

ai_messages_agg as (
    select
        thread_id,
        array_agg(
            message_content
            order by msg_num
        ) as ai_messages
    from (select
        thread_id,
        row_number() over (
            partition by thread_id
            order by msg_num
        ) as msg_num,
        message_content
    from (
        select
            fm.thread_id,
            row_number() over () as msg_num,
            fm.message_content
        from filtered_messages as fm
        where
            fm.message_content is not NULL
            and fm.msg_type = 'ai'
    ) as numbered_ai_messages) as ordered_ai_messages
    group by thread_id
)

select
    t.thread_id,
    t.created_at,
    t.updated_at,
    t.metadata,
    t.status,
    t.config,
    t.values,
    t.interrupts,
    coalesce(m.messages, array[]::text []) as messages,
    coalesce(h.human_messages, array[]::text []) as human_messages,
    coalesce(a.ai_messages, array[]::text []) as ai_messages
from thread as t
left join
    messages_agg as m on t.thread_id = m.thread_id
left join
    human_messages_agg as h on t.thread_id = h.thread_id
left join
    ai_messages_agg as a on t.thread_id = a.thread_id;


-- Thread view analysis
create or replace view thread_analysis as
select
    metadata::jsonb ->> 'graph_id' as graph_id,
    date(created_at) as day,
    count(thread_id) as total_threads,
    count(case when status = 'idle' then 1 end) as idle_threads,
    count(case when status = 'error' then 1 end) as error_threads,
    count(case when status = 'interrupted' then 1 end) as interrupted_threads,
    sum(array_length(messages, 1)) as total_messages,
    sum(array_length(human_messages, 1)) as human_messages,
    sum(array_length(ai_messages, 1)) as ai_messages,
    round(avg(nullif(array_length(messages, 1), 0)), 2) as average_thread_length,
    min(nullif(array_length(messages, 1), 0)) as shortest_thread_length,
    max(array_length(messages, 1)) as longest_thread_length
from thread_view
group by graph_id, day;


-- Feedback view with feedback comment and expected answer
create or replace view feedback_view as
select
    graph_id,
    run_id,
    thread_id,
    human_message,
    ai_message,
    rating,
    feedback_text,
    -- Final trimmed feedback_comment
    split_part(trimmed_text, E'\n', 1) as feedback_comment,
    -- Final trimmed feedback_expected_answer
    case
        when trimmed_text ~ E'\n'
            then
                nullif(
                    trim(both E' \t\n\r' from regexp_replace(
                        trimmed_text,
                        E'^[^\n]*\n+', -- remove first line + all consecutive newlines after it
                        ''
                    )),
                    ''
                )
    end as feedback_expected_answer,
    created_at,
    updated_at
from (select
    a.graph_id,
    f.run_id,
    f.thread_id,
    f.human_message,
    f.ai_message,
    f.rating,
    f.feedback_text,
    f.created_at,
    f.updated_at,
    -- Trim leading/trailing spaces, tabs, newlines, etc. from the raw text
    trim(both E' \t\n\r' from f.feedback_text) as trimmed_text
from feedback as f
inner join run as r on f.run_id = r.run_id
inner join assistant as a on r.assistant_id = a.assistant_id) as feedback_graph;


-- Feedback view analysis
create or replace view feedback_analysis as
select
    graph_id,
    date(created_at) as day,
    -- Total ratings
    count(case when rating is not NULL then 1 end) as rating_count,
    -- Ratings with and without feedback
    count(case when rating is not NULL and feedback_text is not NULL then 1 end) as rating_w_feedback,
    count(case when rating is not NULL and feedback_text is NULL then 1 end) as rating_wo_feedback,
    -- Thumbs up counts
    count(case when rating = 'thumbs_up' then 1 end) as thumbs_up_count,
    count(case when rating = 'thumbs_up' and feedback_text is not NULL then 1 end) as thumbs_up_w_feedback,
    count(case when rating = 'thumbs_up' and feedback_text is NULL then 1 end) as thumbs_up_wo_feedback,
    -- Thumbs down counts
    count(case when rating = 'thumbs_down' then 1 end) as thumbs_down_count,
    count(case when rating = 'thumbs_down' and feedback_text is not NULL then 1 end) as thumbs_down_w_feedback,
    count(case when rating = 'thumbs_down' and feedback_text is NULL then 1 end) as thumbs_down_wo_feedback,

    -- Rate calculations
    case
        when count(case when rating is not NULL then 1 end) > 0
            then round((
                count(case when rating = 'thumbs_up' then 1 end)::numeric
                / count(case when rating is not NULL then 1 end)
            ) * 100, 2)
        else 0
    end as thumbs_up_rate,

    case
        when count(case when rating is not NULL then 1 end) > 0
            then round((
                count(case when rating = 'thumbs_up' and feedback_text is not NULL then 1 end)::numeric
                / count(case when rating is not NULL then 1 end)
            ) * 100, 2)
        else 0
    end as thumbs_up_w_feedback_rate,

    case
        when count(case when rating is not NULL then 1 end) > 0
            then round((
                count(case when rating = 'thumbs_up' and feedback_text is NULL then 1 end)::numeric
                / count(case when rating is not NULL then 1 end)
            ) * 100, 2)
        else 0
    end as thumbs_up_wo_feedback_rate,

    case
        when count(case when rating is not NULL then 1 end) > 0
            then round((
                count(case when rating = 'thumbs_down' then 1 end)::numeric
                / count(case when rating is not NULL then 1 end)
            ) * 100, 2)
        else 0
    end as thumbs_down_rate,

    case
        when count(case when rating is not NULL then 1 end) > 0
            then round((
                count(case when rating = 'thumbs_down' and feedback_text is not NULL then 1 end)::numeric
                / count(case when rating is not NULL then 1 end)
            ) * 100, 2)
        else 0
    end as thumbs_down_w_feedback_rate,

    case
        when count(case when rating is not NULL then 1 end) > 0
            then round((
                count(case when rating = 'thumbs_down' and feedback_text is NULL then 1 end)::numeric
                / count(case when rating is not NULL then 1 end)
            ) * 100, 2)
        else 0
    end as thumbs_down_wo_feedback_rate
from feedback_view
group by graph_id, day;


-- Thread and Feedback view analysis
create or replace view thread_feedback_analysis as
select
    t.graph_id,
    t.day,
    -- Thread metrics
    t.total_threads,
    t.idle_threads,
    t.error_threads,
    t.interrupted_threads,
    t.total_messages,
    t.human_messages,
    t.ai_messages,
    t.average_thread_length,
    t.shortest_thread_length,
    t.longest_thread_length,
    -- Feedback counts
    f.rating_count,
    f.rating_w_feedback,
    f.rating_wo_feedback,
    f.thumbs_up_count,
    f.thumbs_up_w_feedback,
    f.thumbs_up_wo_feedback,
    f.thumbs_down_count,
    f.thumbs_down_w_feedback,
    f.thumbs_down_wo_feedback,
    -- Feedback rates from feedback_analysis
    f.thumbs_up_rate,
    f.thumbs_up_w_feedback_rate,
    f.thumbs_up_wo_feedback_rate,
    f.thumbs_down_rate,
    f.thumbs_down_w_feedback_rate,
    f.thumbs_down_wo_feedback_rate,
    -- Updated feedback_rate calculation (based on ai_messages)
    case
        when t.ai_messages > 0 then round((f.rating_count::numeric / t.ai_messages) * 100, 2)
        else 0
    end as rating_rate,
    case
        when t.ai_messages > 0 then round((f.rating_w_feedback::numeric / t.ai_messages) * 100, 2)
        else 0
    end as feedback_rate
from thread_analysis as t
left join
    feedback_analysis as f on t.graph_id = f.graph_id and t.day = f.day;
