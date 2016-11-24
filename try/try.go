package main

import (
	"fmt"
	"github.com/HuKeping/rbtree"
	"github.com/Workiva/go-datastructures/augmentedtree"
	"ilex/ilex"
	"unsafe"
)

type Anchor struct {
	Range ilex.Range
	Link  *ilex.TwoWayLink
}

func (a Anchor) LowAtDimension(d uint64) int64 {
	return int64(a.Range.Position)
}

func (a Anchor) HighAtDimension(d uint64) int64 {
	return int64(a.Range.Position + a.Range.Length - 1)
}

func (a Anchor) OverlapsAtDimension(i augmentedtree.Interval, d uint64) bool {
	p := i.(Anchor).Range.Position
	return p >= a.Range.Position && p <=
		(a.Range.Position+a.Range.Length-1)
}

func (a Anchor) ID() uint64 {
	return *(*uint64)(unsafe.Pointer(a.Link))
}

func (a Anchor) Less(b rbtree.Item) bool {
	return a.Range.Position < b.(Anchor).Range.Position
}

func main() {
	tree := rbtree.New()

	for i := 0; i < 10; i++ {
		tree.Insert(Anchor{ilex.Range{100 - i, i}, nil})
	}

	tree.Ascend(tree.Min(), Print)

	j := tree.Get(Anchor{ilex.Range{95, 0}, nil})
	Print(j)

	var b ilex.TwoWayLink

	t := augmentedtree.New(1)
	anchors := make([]augmentedtree.Interval, 0)
	for i := 0; i < 10; i++ {
		anchors = append(anchors, Anchor{ilex.Range{100 - i, 2*i + 1}, &b})
	}
	t.Add(anchors...)

	fmt.Println(t.Len())
	fmt.Println(t.Query(Anchor{ilex.Range{1, 1001}, nil}))

}

func Print(item rbtree.Item) bool {
	a, ok := item.(Anchor)
	if !ok {
		return false
	}
	fmt.Println(a)
	return true
}
