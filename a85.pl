#!/usr/bin/perl
#-----------------------------------------------------------------------info-#[
## <info> TODO
## </info>
#----------------------------------------------------------------------------#]
use strict;
use warnings;
no warnings qw/once/;
use File::Basename;
use lib dirname( __FILE__ );
use Asm85;

( $main::prog ) = $0 =~ /([^\\\/]*)$/;

if ( @ARGV < 1 ) {
    warn "Missing arguments.\n";
    warn "Usage: $main::prog <asm file>\n";
    exit 1;
}

open SOURCE, $ARGV[0];
undef $/;
my $source = <SOURCE>;
close SOURCE;

Asm85::parseSource( $source );
warn Status::toString();

unless ( Status::getErrorCount() ) {
    my $ihx = Asm85::createIhx();
    print $ihx;
}

exit 0;

