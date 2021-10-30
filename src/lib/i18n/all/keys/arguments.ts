import { FT, T } from '#lib/types';

export const ArgsMissing = T('arguments:missing');
export const BooleanError = FT<{ parameter: string; possibles: string[]; count: number }>('arguments:booleanError');
export const ChannelError = FT<{ parameter: string }>('arguments:channelError');
export const Command = FT<{ parameter: string }>('arguments:command');
export const DateError = FT<{ parameter: string }>('arguments:dateError');
export const DateTooFar = FT<{ parameter: string; maximum: number }>('arguments:dateTooFar');
export const DateTooEarly = FT<{ parameter: string; minimum: number }>('arguments:dateTooEarly');
export const DmChannelError = FT<{ parameter: string }>('arguments:dmChannelError');
export const Duration = FT<{ parameter: string }>('arguments:duration');
export const FloatError = FT<{ parameter: string }>('arguments:floatError');
export const FloatTooLarge = FT<{ parameter: string; maximum: number }>('arguments:floatTooLarge');
export const FloatTooSmall = FT<{ parameter: string; minimum: number }>('arguments:floatTooSmall');
export const GuildChannelError = FT<{ parameter: string }>('arguments:guildChannelError');
export const GuildChannelMissingGuildError = FT<{ parameter: string }>('arguments:guildChannelMissingGuildError');
export const GuildPrivateThreadChannelError = FT<{ parameter: string }>('arguments:guildPrivateThreadChannelError');
export const GuildPublicThreadChannelError = FT<{ parameter: string }>('arguments:guildPublicThreadChannelError');
export const GuildStageVoiceChannelError = FT<{ parameter: string }>('arguments:guildStageVoiceChannelError');
export const GuildTextChannelError = FT<{ parameter: string }>('arguments:guildTextChannelError');
export const GuildThreadChannelError = T('arguments:guildThreadChannelError');
export const GuildVoiceChannelError = FT<{ parameter: string }>('arguments:guildVoiceChannelError');
export const GuildNewsChannelError  = FT<{ parameter: string }>('arguments:guildNewsChannelError');
export const HyperlinkError = FT<{ parameter: string }>('arguments:hyperlinkError');
export const IntegerError = FT<{ parameter: string }>('arguments:integerError');
export const IntegerTooLarge = FT<{ parameter: string; maximum: number }>('arguments:integerTooLarge');
export const IntegerTooSmall = FT<{ parameter: string; minimum: number }>('arguments:integerTooSmall');
export const MemberError = FT<{ parameter: string }>('arguments:memberError');
export const MemberMissingGuild = FT<{ parameter: string }>('arguments:memberMissingGuild');
export const MessageError = FT<{ parameter: string }>('arguments:messageError');
export const NumberError = FT<{ parameter: string }>('arguments:numberError');
export const NumberTooLarge = FT<{ parameter: string; maximum: number }>('arguments:numberTooLarge');
export const NumberTooSmall = FT<{ parameter: string; minimum: number }>('arguments:numberTooSmall');
export const RoleError = FT<{ parameter: string }>('arguments:roleError');
export const StringTooLong = FT<{ parameter: string; maximum: number }>('arguments:stringTooLong');
export const StringTooShort = FT<{ parameter: string; minimum: number }>('arguments:stringTooShort');
export const UserError = FT<{ parameter: string }>('arguments:userError');